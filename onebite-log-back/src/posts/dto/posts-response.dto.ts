import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Like, Post, User } from '@prisma/client';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class PostResponseDto {
  @ApiProperty({ description: '게시글 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '게시글 내용', example: '게시글 내용' })
  content: string;

  @ApiProperty({ description: '좋아요 수', example: 1 })
  likeCount: number;

  @ApiPropertyOptional({
    description: '이미지 URL 배열',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
    nullable: true,
  })
  imageUrls: string[] | null;

  @ApiProperty({ description: '작성자 ID', example: '1' })
  authorId: string;

  @ApiProperty({ description: '작성일', example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({
    description: '작성자 정보',
    type: () => UserResponseDto,
  })
  author?: UserResponseDto;

  @ApiProperty({
    description: '현재 사용자의 좋아요 여부',
    example: true,
  })
  isLiked: boolean;

  /**
   * PostResponseDto 생성자
   * @param post 게시글 엔티티
   * @param user 작성자 정보 (선택)
   * @param like 현재 사용자의 좋아요 정보 (선택, 좋아요 여부 판단용)
   */
  constructor(post: Post, user?: User | null, like?: Like | null) {
    this.id = post.id;
    this.content = post.content;
    this.likeCount = post.likeCount;

    // JSON 문자열을 배열로 파싱
    // this.imageUrls = post.imageUrls ? JSON.parse(post.imageUrls) : null;

    this.authorId = post.authorId;
    this.createdAt = post.createdAt;

    // 작성자 정보가 있으면 UserResponseDto로 변환
    if (user) {
      this.author = new UserResponseDto(user);
    }

    // 좋아요 객체가 있으면 해당 사용자가 좋아요를 누른 것
    this.isLiked = !!like;
  }
}
