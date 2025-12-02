import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiCookieAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { SignInResponseDto } from 'src/auth/dto/sign-in-response.dto';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { SignUpResponseDto } from 'src/auth/dto/sign-up-response.dto';
import { ResponseDto } from 'src/common/dto/respone.dto';

/**
 * RefreshToken 쿠키 이름
 */
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * RefreshToken 쿠키 기본 옵션
 * - httpOnly: JavaScript에서 접근 불가 (XSS 방지)
 * - secure: HTTPS에서만 전송 (production)
 * - sameSite: CSRF 방지
 * - path: /auth 경로에서만 쿠키 전송
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입 API
   * - 이메일, 비밀번호, 닉네임으로 회원가입
   * - 성공 시 자동 로그인하지 않음 (별도 로그인 필요)
   */
  @Post('sign-up')
  @ApiOperation({
    summary: '회원가입 API',
    description:
      '이메일, 비밀번호, 닉네임으로 회원가입합니다. 성공 후 별도로 로그인이 필요합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: SignUpResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이메일 또는 닉네임 중복',
  })
  @ApiResponse({
    status: 400,
    description: '입력값 유효성 검사 실패',
  })
  async signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<ResponseDto<SignUpResponseDto | void>> {
    const result = await this.authService.signUp(signUpDto);

    return ResponseDto.success({
      id: result.userId,
      email: result.email,
      nickname: result.nickname,
      message: '회원가입이 완료되었습니다.',
    });
  }

  /**
   * 로그인 API
   * - 이메일/비밀번호로 로그인
   * - AccessToken은 JSON 응답으로 반환
   * - RefreshToken은 HttpOnly 쿠키로 설정
   */
  @Post('sign-in')
  @ApiOperation({
    summary: '로그인 API',
    description:
      '이메일/비밀번호로 로그인합니다. AccessToken은 JSON으로, RefreshToken은 HttpOnly 쿠키로 반환됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    type: SignInResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (이메일/비밀번호 불일치)',
  })
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<SignInResponseDto | void>> {
    // 요청에서 메타데이터 추출
    const metadata = {
      userAgent: req.headers['user-agent'],
      clientIp: this.getClientIp(req),
    };
    // 로그인 처리
    const result = await this.authService.signIn(signInDto, metadata);

    // RefreshToken을 HttpOnly 쿠키로 설정
    // maxAge: 7일 (밀리초 단위)
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // AccessToken과 사용자 정보만 JSON으로 반환
    return ResponseDto.success({
      accessToken: result.accessToken,
      id: result.userId,
      email: result.email,
    });
  }

  /**
   * 토큰 재발급 API
   * - 쿠키의 RefreshToken으로 새 토큰 발급
   * - 토큰 회전: 새 RefreshToken으로 교체
   */
  @Post('refresh')
  @ApiOperation({
    summary: '토큰 재발급 API',
    description:
      '쿠키의 RefreshToken으로 새로운 AccessToken과 RefreshToken을 발급받습니다. (토큰 회전)',
  })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 201,
    description: '토큰 재발급 성공',
    type: SignInResponseDto,
  })
  @ApiResponse({ status: 401, description: 'RefreshToken이 유효하지 않음' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<SignInResponseDto | void>> {
    // 쿠키에서 RefreshToken 추출
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    // 요청에서 메타데이터 추출
    const metadata = {
      userAgent: req.headers['user-agent'],
      clientIp: this.getClientIp(req),
    };

    // 토큰 재발급
    const result = await this.authService.refreshTokens(refreshToken, metadata);

    // 새 RefreshToken을 쿠키로 설정
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    return ResponseDto.success({
      accessToken: result.accessToken,
      id: result.userId,
      email: result.email,
    });
  }

  /**
   * 로그아웃 API
   * - 세션 삭제 및 쿠키 제거
   */
  @Post('logout')
  @ApiOperation({
    summary: '로그아웃 API',
    description: '현재 세션에서 로그아웃합니다. 쿠키가 삭제됩니다.',
  })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 201, description: '로그아웃 성공' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<{ message: string } | void>> {
    // 쿠키에서 RefreshToken 추출
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    // 세션 삭제
    await this.authService.logout(refreshToken);

    // 쿠키 삭제 (즉시 만료)
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...COOKIE_OPTIONS,
    });

    return ResponseDto.success({ message: '로그아웃되었습니다.' });
  }

  /**
   * 요청에서 클라이언트 IP 추출
   * - 프록시/로드밸런서 뒤에 있을 경우 X-Forwarded-For 헤더 사용
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // X-Forwarded-For는 쉼표로 구분된 IP 목록일 수 있음 (첫 번째가 원본 IP)
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    return req.ip;
  }
}
