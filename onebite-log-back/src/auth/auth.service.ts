import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';

/**
 * JWT 토큰의 payload 타입
 */
interface JwtPayload {
  sub: string; // userId
  email: string;
}

/**
 * 세션 생성 시 필요한 메타데이터
 */
export interface SessionMetadata {
  userAgent?: string;
  clientIp?: string;
}

/**
 * 내부에서 사용하는 토큰 + 사용자 정보 반환 타입
 */
export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

/**
 * 회원가입 결과 타입
 */
export interface SignUpResult {
  userId: string;
  email: string;
  nickname: string;
}

@Injectable()
export class AuthService {
  // bcrypt 해시 라운드 (높을수록 보안 강화, 성능 저하)
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
  ) {
    // 컨텍스트 설정 (로그에 서비스명 표시)
    this.logger.setContext(AuthService.name);
  }

  /**
   * 회원가입
   * 1. 이메일/닉네임 중복 체크
   * 2. 비밀번호 해시
   * 3. Profile + Auth 레코드 생성 (트랜잭션)
   *
   * @param signUpDto - 이메일, 비밀번호, 닉네임
   * @returns userId, email, nickname
   */
  async signUp(signUpDto: SignUpDto): Promise<SignUpResult> {
    const { email, password, nickname } = signUpDto;
    const traceId = this.cls.getId();

    this.logger.info({
      msg: 'Sign-up attempt started',
      traceId,
      email,
      nickname,
    });

    try {
      // 1. 이메일 중복 체크
      const existingAuth = await this.prisma.auth.findUnique({
        where: { email },
      });
      if (existingAuth) {
        this.logger.warn({
          msg: 'Sign-up failed: Email already exists',
          traceId,
          email,
        });
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }

      // 2. 닉네임 중복 체크
      const existingUser = await this.prisma.user.findUnique({
        where: { nickname },
      });
      if (existingUser) {
        this.logger.warn({
          msg: 'Sign-up failed: Nickname already exists',
          traceId,
          nickname,
        });
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }

      // 3. 비밀번호 해시
      const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // 4. Profile + Auth 생성 (트랜잭션으로 원자성 보장)
      const result = await this.prisma.$transaction(async (tx) => {
        // Profile 먼저 생성 (Auth가 Profile을 참조하므로)
        const profile = await tx.user.create({
          data: {
            nickname,
          },
        });

        // Auth 생성 (Profile과 연결)
        const auth = await tx.auth.create({
          data: {
            userId: profile.id,
            email,
            password: hashedPassword,
            provider: 'email',
            providerId: email, // 이메일 로그인의 경우 이메일을 providerId로 사용
          },
        });

        return { profile, auth };
      });

      this.logger.info({
        msg: 'Sign-up completed successfully',
        traceId,
        userId: result.profile.id,
        email: result.auth.email,
        nickname: result.profile.nickname,
      });

      return {
        userId: result.profile.id,
        email: result.auth.email,
        nickname: result.profile.nickname,
      };
    } catch (error) {
      // ConflictException은 이미 로깅했으므로 다시 던지기만
      if (error instanceof ConflictException) {
        throw error;
      }

      // 예상치 못한 에러는 에러 로그 남기기
      this.logger.error({
        msg: 'Sign-up failed with unexpected error',
        traceId,
        email,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  /**
   * 이메일/비밀번호로 로그인
   * 1. Auth 테이블에서 사용자 조회
   * 2. 비밀번호 검증
   * 3. AccessToken + RefreshToken 발급
   * 4. Session 테이블에 RefreshToken 저장
   *
   * @param signInDto - 이메일, 비밀번호
   * @param metadata - userAgent, clientIp 등 세션 메타데이터
   * @returns accessToken, refreshToken, userId, email
   */
  async signIn(
    signInDto: SignInDto,
    metadata: SessionMetadata = {},
  ): Promise<TokenResult> {
    const { email, password } = signInDto;
    const traceId = this.cls.getId();

    this.logger.info({
      msg: 'Sign-in attempt started',
      traceId,
      email,
      userAgent: metadata.userAgent,
      clientIp: metadata.clientIp,
    });

    try {
      // 1. Auth 테이블에서 이메일로 사용자 조회
      const auth = await this.prisma.auth.findUnique({
        where: { email },
        include: { user: true }, // 프로필 정보도 함께 조회
      });

      // 사용자가 없으면 에러
      if (!auth) {
        this.logger.warn({
          msg: 'Sign-in failed: User not found',
          traceId,
          email,
        });
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 올바르지 않습니다.',
        );
      }

      // 소셜 로그인 사용자는 비밀번호가 없을 수 있음
      if (!auth.password) {
        this.logger.warn({
          msg: 'Sign-in failed: Social login account',
          traceId,
          email,
          provider: auth.provider,
        });
        throw new UnauthorizedException(
          '이 계정은 소셜 로그인으로 가입되었습니다. 해당 소셜 계정으로 로그인해 주세요.',
        );
      }

      // 2. 비밀번호 검증 (bcrypt로 해시 비교)
      const isPasswordValid = await bcrypt.compare(password, auth.password);
      if (!isPasswordValid) {
        this.logger.warn({
          msg: 'Sign-in failed: Invalid password',
          traceId,
          email,
        });
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 올바르지 않습니다.',
        );
      }

      // 3. JWT 토큰 발급
      const payload: JwtPayload = {
        sub: auth.userId,
        email: auth.email,
      };

      // AccessToken 생성 (JwtModule에 등록된 기본 설정 사용)
      const accessToken = await this.jwtService.signAsync(payload);

      // RefreshToken 생성 (별도 secret과 만료시간 사용)
      const refreshTokenSecret = this.configService.get<string>(
        'REFRESH_TOKEN_SECRET',
      );
      const refreshTokenExpirationStr =
        this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '7d';

      // ms 단위로 변환하여 사용
      const refreshTokenExpirationMs = this.parseExpiration(
        refreshTokenExpirationStr,
      );

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: Math.floor(refreshTokenExpirationMs / 1000), // 초 단위
      });

      // 4. Session 테이블에 RefreshToken 저장
      const expiresAt = new Date(Date.now() + refreshTokenExpirationMs);

      await this.prisma.session.create({
        data: {
          userId: auth.userId,
          refreshToken,
          expiresAt,
          userAgent: metadata.userAgent ?? null,
          clientIp: metadata.clientIp ?? null,
        },
      });

      this.logger.info({
        msg: 'Sign-in completed successfully',
        traceId,
        userId: auth.userId,
        email: auth.email,
        userAgent: metadata.userAgent,
        clientIp: metadata.clientIp,
      });

      return {
        accessToken,
        refreshToken,
        userId: auth.userId,
        email: auth.email,
      };
    } catch (error) {
      // UnauthorizedException은 이미 로깅했으므로 다시 던지기만
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // 예상치 못한 에러는 에러 로그 남기기
      this.logger.error({
        msg: 'Sign-in failed with unexpected error',
        traceId,
        email,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  /**
   * RefreshToken으로 새 토큰 발급 (토큰 회전)
   * 1. RefreshToken 검증
   * 2. Session 테이블에서 토큰 확인
   * 3. 새 AccessToken + RefreshToken 발급
   * 4. 기존 세션 삭제 후 새 세션 생성 (토큰 회전)
   *
   * @param refreshToken - 쿠키에서 받은 RefreshToken
   * @param metadata - userAgent, clientIp 등 세션 메타데이터
   * @returns 새로운 accessToken, refreshToken, userId, email
   */
  async refreshTokens(
    refreshToken: string,
    metadata: SessionMetadata = {},
  ): Promise<TokenResult> {
    const traceId = this.cls.getId();

    this.logger.info({
      msg: 'Token refresh attempt started',
      traceId,
      userAgent: metadata.userAgent,
      clientIp: metadata.clientIp,
    });

    try {
      // 1. RefreshToken 검증
      const refreshTokenSecret = this.configService.get<string>(
        'REFRESH_TOKEN_SECRET',
      );

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
          secret: refreshTokenSecret,
        });
      } catch (error) {
        this.logger.warn({
          msg: 'Token refresh failed: Invalid or expired token',
          traceId,
          error: {
            name: error.name,
            message: error.message,
          },
        });
        throw new UnauthorizedException(
          '유효하지 않거나 만료된 RefreshToken입니다.',
        );
      }

      // 2. Session 테이블에서 해당 RefreshToken이 존재하는지 확인
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session) {
        // 토큰이 DB에 없음 = 이미 로그아웃했거나 탈취된 토큰
        this.logger.warn({
          msg: 'Token refresh failed: Session not found (possible token theft)',
          traceId,
          userId: payload.sub,
        });
        throw new UnauthorizedException(
          '세션이 만료되었거나 이미 로그아웃되었습니다.',
        );
      }

      // 만료 시간 체크
      if (session.expiresAt < new Date()) {
        // 만료된 세션 삭제
        await this.prisma.session.delete({ where: { id: session.id } });
        this.logger.warn({
          msg: 'Token refresh failed: Session expired',
          traceId,
          userId: payload.sub,
          sessionId: session.id,
        });
        throw new UnauthorizedException(
          '세션이 만료되었습니다. 다시 로그인해 주세요.',
        );
      }

      // 3. 새 토큰 발급
      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload);

      const refreshTokenExpirationStr =
        this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '7d';
      const refreshTokenExpirationMs = this.parseExpiration(
        refreshTokenExpirationStr,
      );

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        secret: refreshTokenSecret,
        expiresIn: Math.floor(refreshTokenExpirationMs / 1000), // 초 단위
      });

      // 4. 토큰 회전: 기존 세션 삭제 후 새 세션 생성
      const newExpiresAt = new Date(Date.now() + refreshTokenExpirationMs);

      await this.prisma.$transaction([
        // 기존 세션 삭제
        this.prisma.session.delete({ where: { id: session.id } }),
        // 새 세션 생성
        this.prisma.session.create({
          data: {
            userId: payload.sub,
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
            userAgent: metadata.userAgent ?? null,
            clientIp: metadata.clientIp ?? null,
          },
        }),
      ]);

      this.logger.info({
        msg: 'Token refresh completed successfully',
        traceId,
        userId: payload.sub,
        userAgent: metadata.userAgent,
        clientIp: metadata.clientIp,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      // UnauthorizedException은 이미 로깅했으므로 다시 던지기만
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // 예상치 못한 에러는 에러 로그 남기기
      this.logger.error({
        msg: 'Token refresh failed with unexpected error',
        traceId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  /**
   * 로그아웃 - 세션 삭제
   *
   * @param refreshToken - 쿠키에서 받은 RefreshToken
   */
  async logout(refreshToken: string): Promise<void> {
    const traceId = this.cls.getId();

    if (!refreshToken) {
      this.logger.debug({
        msg: 'Logout attempt without token',
        traceId,
      });
      return; // 토큰이 없으면 그냥 성공 처리
    }

    this.logger.info({
      msg: 'Logout attempt started',
      traceId,
    });

    // RefreshToken으로 세션 찾아서 삭제
    try {
      const deletedSession = await this.prisma.session.delete({
        where: { refreshToken },
      });

      this.logger.info({
        msg: 'Logout completed successfully',
        traceId,
        userId: deletedSession.userId,
        sessionId: deletedSession.id,
      });
    } catch (error) {
      // 이미 삭제된 세션이면 무시 (멱등성 보장)
      this.logger.debug({
        msg: 'Logout: Session already deleted',
        traceId,
      });
    }
  }

  /**
   * 특정 사용자의 모든 세션 삭제 (모든 기기에서 로그아웃)
   *
   * @param userId - 사용자 ID
   */
  async logoutAll(userId: string): Promise<void> {
    const traceId = this.cls.getId();

    this.logger.info({
      msg: 'Logout all sessions attempt started',
      traceId,
      userId,
    });

    try {
      const result = await this.prisma.session.deleteMany({
        where: { userId },
      });

      this.logger.info({
        msg: 'Logout all sessions completed successfully',
        traceId,
        userId,
        deletedSessionCount: result.count,
      });
    } catch (error) {
      this.logger.error({
        msg: 'Logout all sessions failed',
        traceId,
        userId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  /**
   * 만료 시간 문자열을 밀리초로 변환
   * 예: '7d' -> 604800000, '15m' -> 900000
   *
   * @param expiration - '15m', '1h', '7d' 등의 문자열
   * @returns 밀리초 단위의 만료 시간
   */
  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new InternalServerErrorException(
        `잘못된 만료 시간 형식입니다: ${expiration}`,
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': // 초
        return value * 1000;
      case 'm': // 분
        return value * 60 * 1000;
      case 'h': // 시간
        return value * 60 * 60 * 1000;
      case 'd': // 일
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new InternalServerErrorException(
          `잘못된 만료 시간 단위입니다: ${unit}`,
        );
    }
  }
}
