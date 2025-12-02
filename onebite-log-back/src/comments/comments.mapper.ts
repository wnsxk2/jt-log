import { CommentResponseDto } from './dto/comment-response.dto';
import { CommentWithUser } from './comments.service';

/**
 * Comments 엔티티 → DTO 변환을 담당하는 매퍼 클래스
 */
export class CommentsMapper {
  /**
   * 단일 댓글 엔티티를 DTO로 변환
   * @param comment Prisma에서 조회한 댓글 (user 포함)
   * @returns CommentResponseDto
   */
  static toDto(comment: CommentWithUser): CommentResponseDto {
    return new CommentResponseDto(comment, comment.user);
  }

  /**
   * 댓글 엔티티 배열을 DTO 배열로 변환
   * @param comments Prisma에서 조회한 댓글 목록
   * @returns CommentResponseDto[]
   */
  static toDtoList(comments: CommentWithUser[]): CommentResponseDto[] {
    return comments.map((comment) => CommentsMapper.toDto(comment));
  }
}
