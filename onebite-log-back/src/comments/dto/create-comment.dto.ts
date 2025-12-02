import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 댓글 생성 요청 DTO
 */
export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '좋은 글이네요!',
    maxLength: 300,
  })
  @IsString({ message: 'content는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '댓글 내용을 입력해 주세요.' })
  @MaxLength(300, { message: '댓글은 최대 300자까지 입력 가능합니다.' })
  content: string;

  @ApiPropertyOptional({
    description: '루트 댓글 ID (대댓글인 경우, 최상위 댓글 ID)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'rootCommentId는 정수여야 합니다.' })
  rootCommentId?: number;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우, 직접 답글을 다는 댓글 ID)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'parentCommentId는 정수여야 합니다.' })
  parentCommentId?: number;
}
