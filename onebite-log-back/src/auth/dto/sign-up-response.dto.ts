import { ApiProperty } from '@nestjs/swagger';

/**
 * 회원가입 성공 시 반환되는 응답 데이터
 */
export class SignUpResponseDto {
  @ApiProperty({
    description: '생성된 사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: 'cooluser123',
  })
  nickname: string;

  @ApiProperty({
    description: '회원가입 완료 메시지',
    example: '회원가입이 완료되었습니다.',
  })
  message: string;
}
