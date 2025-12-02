import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * 댓글 수정 요청 DTO
 */
export class UpdateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '수정된 댓글 내용입니다.',
    maxLength: 300,
  })
  @IsString({ message: 'content는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '댓글 내용을 입력해 주세요.' })
  @MaxLength(300, { message: '댓글은 최대 300자까지 입력 가능합니다.' })
  content: string;
}
