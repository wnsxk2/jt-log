/**
 * JWT 토큰에서 추출된 사용자 정보 타입
 *
 * JwtStrategy.validate() 메서드에서 반환하는 객체 구조와 일치해야 합니다.
 * 이 타입은 req.user에 저장되며, @CurrentUser 데코레이터를 통해 접근할 수 있습니다.
 */
export interface JwtPayload {
  /** 사용자 고유 ID (JWT의 sub 클레임에서 추출) */
  userId: string;

  /** 사용자 이메일 */
  email: string;
}
