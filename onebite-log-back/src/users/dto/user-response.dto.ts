import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: 'test1234',
  })
  nickname: string;

  @ApiProperty({
    description: '사용자 소개',
    example: '안녕하세요, 저는 테스트 사용자입니다.',
  })
  bio: string;

  @ApiProperty({
    description: '사용자 아바타 URL',
    example: 'https://example.com/avatar.png',
  })
  avatarUrl: string;

  @ApiProperty({
    description: '사용자 생성 시간',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  constructor(data: User) {
    this.id = data.id;
    this.nickname = data.nickname;
    this.bio = data.bio;
    this.avatarUrl = data.avatarUrl;
  }
}
