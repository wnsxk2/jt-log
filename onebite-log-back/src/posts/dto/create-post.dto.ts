import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

/**
 * 게시글 생성 요청 DTO
 */
export class CreatePostDto {
  @ApiProperty({
    description: '게시글 내용',
    example: '오늘 맛있는 점심을 먹었습니다! 🍜',
    maxLength: 500,
  })
  @IsString({ message: 'content는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '게시글 내용을 입력해 주세요.' })
  @MaxLength(500, { message: '게시글 내용은 최대 500자까지 입력 가능합니다.' })
  content: string;

  @ApiPropertyOptional({
    description: '이미지 URL 배열 (최대 10개)',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'imageUrls는 배열이어야 합니다.' })
  @IsUrl(
    {},
    { each: true, message: '각 이미지 URL은 올바른 형식이어야 합니다.' },
  )
  @ArrayMaxSize(10, { message: '이미지는 최대 10개까지 업로드 가능합니다.' })
  imageUrls?: string[];
}
