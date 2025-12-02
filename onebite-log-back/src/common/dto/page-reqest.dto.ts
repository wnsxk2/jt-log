import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 페이징 요청 DTO
 *
 * 목록 조회 API에서 페이징 파라미터를 받기 위한 공통 DTO입니다.
 * Query Parameter로 `?page=1&limit=20` 형태로 사용됩니다.
 */
export class PageRequestDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // Query string은 문자열이므로 숫자로 변환
  @IsInt({ message: 'page는 정수여야 합니다.' })
  @Min(1, { message: 'page는 1 이상이어야 합니다.' })
  page: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다.' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다.' })
  @Max(100, { message: 'limit는 최대 100까지 가능합니다.' })
  limit: number = 20;

  @ApiPropertyOptional({
    description: '작성자 ID (특정 유저의 게시글만 조회할 때 사용)',
    example: 'user-uuid-1234',
  })
  @IsOptional()
  @IsString({ message: 'authorId는 문자열이어야 합니다.' })
  authorId?: string;

  /**
   * DB 쿼리에 사용할 offset 값 계산
   * page=1, limit=20 → offset=0
   * page=2, limit=20 → offset=20
   */
  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
