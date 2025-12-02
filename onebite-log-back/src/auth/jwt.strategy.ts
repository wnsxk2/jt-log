import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // 헤더의 Bearer 토큰 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 토큰 만료 시 401 에러 발생 (false로 설정 시 직접 처리해야 함)
      ignoreExpiration: false,
      // 환경변수에서 비밀키 가져오기 (절대 코드에 하드코딩 금지)
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // 토큰 검증이 성공하면 이 메서드가 호출됨
  // 리턴값은 자동으로 req.user에 들어감
  async validate(payload: any) {
    // payload: 토큰을 만들 때 넣었던 데이터 (예: userId, email)
    return { userId: payload.sub, email: payload.email };
  }
}
