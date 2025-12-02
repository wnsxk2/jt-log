import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * @CurrentUser 데코레이터
 *
 * 컨트롤러에서 현재 로그인한 사용자 정보를 쉽게 가져올 수 있게 해주는 커스텀 데코레이터입니다.
 *
 * 사용 예시:
 * ```
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user; // { userId: '...', email: '...' }
 * }
 *
 * @Get('posts')
 * getPosts(@CurrentUser('userId') userId: string) {
 *   return this.postsService.getPosts(userId);
 * }
 * ```
 *
 * @param data - 특정 필드만 추출하고 싶을 때 사용 (예: 'userId', 'email')
 * @returns JwtPayload 전체 또는 특정 필드 값
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    // data가 있으면 해당 필드만 반환, 없으면 전체 user 객체 반환
    return data ? user?.[data] : user;
  },
);
