import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '닉네임',
    example: 'test1234',
  })
  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '소개',
    example: '안녕하세요, 저는 테스트 사용자입니다.',
  })
  @IsString({ message: '소개는 문자열이어야 합니다.' })
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: '아바타 URL',
    example: 'https://example.com/avatar.png',
  })
  @IsString({ message: '아바타 URL은 문자열이어야 합니다.' })
  @IsOptional()
  avatarUrl?: string;
}
