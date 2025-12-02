import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이징 메타 정보
 * 클라이언트가 다음/이전 페이지 이동, 전체 데이터 수 파악 등에 활용합니다.
 */
export class PageMeta {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 항목 수', example: 100 })
  totalCount: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPrev: boolean;

  constructor(page: number, limit: number, totalCount: number) {
    this.page = page;
    this.limit = limit;
    this.totalCount = totalCount;
    this.totalPages = Math.ceil(totalCount / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

/**
 * 페이징된 응답을 위한 래퍼 클래스
 *
 * 사용 예시:
 * ```
 * const posts = await this.postsService.getPosts(pageRequest);
 * const totalCount = await this.postsService.countPosts();
 * return PageResponseDto.of(posts, pageRequest.page, pageRequest.limit, totalCount);
 * ```
 */
export class PageResponseDto<T> {
  @ApiProperty({ description: '데이터 목록', isArray: true })
  items: T[];

  @ApiProperty({ description: '페이징 메타 정보', type: PageMeta })
  meta: PageMeta;

  constructor(items: T[], meta: PageMeta) {
    this.items = items;
    this.meta = meta;
  }

  /**
   * 페이징 응답 생성 팩토리 메서드
   * @param items 현재 페이지의 데이터 목록
   * @param page 현재 페이지 번호
   * @param limit 페이지당 항목 수
   * @param totalCount 전체 항목 수
   */
  static of<T>(
    items: T[],
    page: number,
    limit: number,
    totalCount: number,
  ): PageResponseDto<T> {
    return new PageResponseDto(items, new PageMeta(page, limit, totalCount));
  }
}
