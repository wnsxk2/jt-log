import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그인 성공 시 클라이언트에게 반환되는 응답 데이터
 * - accessToken: JSON 응답으로 전달 (프론트에서 메모리/스토어에 저장)
 * - refreshToken: HttpOnly 쿠키로 전달 (이 DTO에는 포함되지 않음)
 */
export class SignInResponseDto {
  @ApiProperty({
    description: 'Access Token (Bearer 토큰으로 사용)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@test.com',
  })
  email: string;
}
