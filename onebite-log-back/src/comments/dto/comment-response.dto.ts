import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comment, User } from '@prisma/client';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

/**
 * 댓글 응답 DTO
 */
export class CommentResponseDto {
  @ApiProperty({ description: '댓글 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '댓글 내용', example: '좋은 글이네요!' })
  content: string;

  @ApiProperty({ description: '게시글 ID', example: 1 })
  postId: number;

  @ApiProperty({ description: '작성자 ID', example: 'user-uuid' })
  authorId: string;

  @ApiPropertyOptional({
    description: '루트 댓글 ID (대댓글인 경우)',
    example: 1,
  })
  rootCommentId: number | null;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우)',
    example: 1,
  })
  parentCommentId: number | null;

  @ApiProperty({ description: '작성일', example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '작성자 정보',
    type: () => UserResponseDto,
  })
  author?: UserResponseDto;

  /**
   * CommentResponseDto 생성자
   * @param comment 댓글 엔티티
   * @param user 작성자 정보 (선택)
   */
  constructor(comment: Comment, user?: User | null) {
    this.id = comment.id;
    this.content = comment.content;
    this.postId = comment.postId;
    this.authorId = comment.authorId;
    this.rootCommentId = comment.rootCommentId;
    this.parentCommentId = comment.parentCommentId;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;

    if (user) {
      this.author = new UserResponseDto(user);
    }
  }
}
