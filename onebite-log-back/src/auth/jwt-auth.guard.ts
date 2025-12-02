import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // 디버깅: Authorization 헤더 확인
    console.log('[JwtAuthGuard] ===== JWT Auth Debug =====');
    console.log('[JwtAuthGuard] Authorization header:', authHeader || '(없음)');

    if (authHeader) {
      // Bearer 토큰 형식 확인
      const [type, token] = authHeader.split(' ');
      console.log('[JwtAuthGuard] Token type:', type);
      console.log('[JwtAuthGuard] Token exists:', token ? '✓' : '✗');
      console.log(
        '[JwtAuthGuard] Token preview:',
        token ? `${token.substring(0, 50)}...` : '(없음)',
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 디버깅: 인증 결과 확인
    console.log('[JwtAuthGuard] ===== Auth Result =====');
    console.log('[JwtAuthGuard] Error:', err?.message || '(없음)');
    console.log('[JwtAuthGuard] User:', user || '(없음)');
    console.log('[JwtAuthGuard] Info:', info?.message || info || '(없음)');

    // 토큰 만료 처리
    if (info?.name === 'TokenExpiredError') {
      this.logger.warn('Access token expired');
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: '액세스 토큰이 만료되었습니다.',
      });
    }

    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${info?.message || err?.message || 'Unknown error'}`,
      );
    }

    return super.handleRequest(err, user, info, context);
  }
}
