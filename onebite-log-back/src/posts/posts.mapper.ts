import { PostResponseDto } from './dto/posts-response.dto';
import { PostWithUserAndLikes } from './posts.service';

/**
 * Posts 엔티티 → DTO 변환을 담당하는 매퍼 클래스
 *
 * 컨트롤러에서 직접 DTO 변환 로직을 작성하면 코드가 복잡해지고,
 * 동일한 변환 로직이 여러 곳에서 중복될 수 있습니다.
 *
 * 매퍼를 사용하면:
 * 1. 변환 로직을 한 곳에서 관리할 수 있습니다.
 * 2. 테스트하기 쉬워집니다.
 * 3. 변환 로직 변경 시 영향 범위를 최소화할 수 있습니다.
 */
export class PostsMapper {
  /**
   * 단일 게시글 엔티티를 DTO로 변환
   * @param post Prisma에서 조회한 게시글 (user, likes 포함)
   * @returns PostResponseDto
   */
  static toDto(post: PostWithUserAndLikes): PostResponseDto {
    // likes[0]은 현재 사용자의 좋아요 정보 (where 조건으로 필터링됨)
    return new PostResponseDto(post, post.user, post.likes[0] ?? null);
  }

  /**
   * 게시글 엔티티 배열을 DTO 배열로 변환
   * @param posts Prisma에서 조회한 게시글 목록
   * @returns PostResponseDto[]
   */
  static toDtoList(posts: PostWithUserAndLikes[]): PostResponseDto[] {
    return posts.map((post) => PostsMapper.toDto(post));
  }
}
