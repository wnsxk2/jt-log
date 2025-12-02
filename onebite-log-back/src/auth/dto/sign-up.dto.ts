import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 회원가입 요청 DTO
 */
export class SignUpDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'test@test.com',
    required: true,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해 주세요.' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 6자)',
    example: '123456',
    required: true,
    minLength: 6,
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해 주세요.' })
  password: string;

  @ApiProperty({
    description: '닉네임 (고유해야 함)',
    example: 'test1234',
    required: true,
  })
  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '닉네임을 입력해 주세요.' })
  nickname: string;
}
