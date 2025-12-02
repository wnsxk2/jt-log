import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PostResponseDto } from 'src/posts/dto/posts-response.dto';
import { ResponseDto } from 'src/common/dto/respone.dto';
import { PageRequestDto } from 'src/common/dto/page-reqest.dto';
import { PageResponseDto } from 'src/common/dto/page-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/posts/dto/update-post.dto';
import { CurrentUser } from 'src/auth/decorators';
import { PostsMapper } from './posts.mapper';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: '게시글 목록 조회',
    description:
      '페이징된 게시글 목록을 조회합니다. 각 게시글에는 작성자 정보와 현재 사용자의 좋아요 여부가 포함됩니다. authorId를 제공하면 특정 유저의 게시글만 조회됩니다.',
  })
  @ApiOkResponse({
    description: '게시글 목록 조회 성공',
    schema: {
      example: {
        result: 'success',
        data: {
          items: [
            {
              id: 1,
              content: '게시글 내용입니다.',
              likeCount: 5,
              imageUrls: 'https://example.com/image.jpg',
              authorId: 'user-uuid',
              createdAt: '2025-01-01T00:00:00.000Z',
              author: {
                id: 'user-uuid',
                nickname: '작성자닉네임',
                avatarUrl: 'https://example.com/avatar.jpg',
              },
              isLikedByMe: true,
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            totalCount: 100,
            totalPages: 5,
            hasNext: true,
            hasPrev: false,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async getPosts(
    @Query() pageRequestDto: PageRequestDto,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<PageResponseDto<PostResponseDto>>> {
    // 게시글 목록과 전체 개수를 병렬로 조회 (성능 최적화)
    const [posts, totalCount] = await Promise.all([
      this.postsService.getPosts(userId, pageRequestDto),
      this.postsService.countPosts(pageRequestDto.authorId),
    ]);

    // 매퍼를 통해 엔티티 → DTO 변환
    const postDtos = PostsMapper.toDtoList(posts);

    // 페이징 응답 구조로 래핑
    return ResponseDto.success(
      PageResponseDto.of(
        postDtos,
        pageRequestDto.page,
        pageRequestDto.limit,
        totalCount,
      ),
    );
  }

  @Post()
  @ApiOperation({
    summary: '게시글 생성',
    description:
      '새로운 게시글을 작성합니다. 이미지는 URL 배열 형태로 최대 10개까지 첨부할 수 있습니다.',
  })
  @ApiCreatedResponse({
    description: '게시글 생성 성공',
    type: PostResponseDto,
    schema: {
      example: {
        result: 'success',
        data: {
          id: 1,
          content: '오늘 맛있는 점심을 먹었습니다!',
          likeCount: 0,
          imageUrls: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          authorId: 'user-uuid',
          createdAt: '2025-01-01T00:00:00.000Z',
          author: {
            userId: 'user-uuid',
            nickname: '작성자닉네임',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
          isLikedByMe: false,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async createPost(
    @CurrentUser('userId') userId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ResponseDto<PostResponseDto>> {
    const post = await this.postsService.createPost(userId, createPostDto);
    return ResponseDto.success(PostsMapper.toDto(post));
  }

  @Get(':postId')
  @ApiOperation({
    summary: '게시글 상세 조회',
    description: '게시글 ID로 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '게시글 상세 조회 성공',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async getPostById(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<PostResponseDto>> {
    const post = await this.postsService.getPostById(postId, userId);
    return ResponseDto.success(PostsMapper.toDto(post));
  }

  @Patch(':postId')
  @ApiOperation({
    summary: '게시글 수정',
    description: '본인이 작성한 게시글을 수정합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '게시글 수정 성공',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiForbiddenResponse({ description: '본인이 작성한 게시글이 아님' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async updatePostById(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ResponseDto<PostResponseDto>> {
    const post = await this.postsService.updatePost(
      postId,
      userId,
      updatePostDto,
    );
    return ResponseDto.success(PostsMapper.toDto(post));
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '게시글 삭제',
    description: '본인이 작성한 게시글을 삭제합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '게시글 삭제 성공',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiForbiddenResponse({ description: '본인이 작성한 게시글이 아님' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async deletePostById(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<PostResponseDto>> {
    const deletedPost = await this.postsService.deletePost(postId, userId);
    return ResponseDto.success(PostsMapper.toDto(deletedPost));
  }

  @Patch(':postId/like')
  @ApiOperation({
    summary: '게시글 좋아요',
    description: '게시글에 좋아요를 추가합니다. 이미 좋아요한 경우 무시됩니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '게시글 좋아요 성공',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async likePost(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<PostResponseDto>> {
    const post = await this.postsService.likePost(postId, userId);
    return ResponseDto.success(PostsMapper.toDto(post));
  }

  @Delete(':postId/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '게시글 좋아요 취소',
    description:
      '게시글의 좋아요를 취소합니다. 좋아요하지 않은 경우 무시됩니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '게시글 좋아요 취소 성공',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async unlikePost(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<PostResponseDto>> {
    const post = await this.postsService.unlikePost(postId, userId);
    return ResponseDto.success(PostsMapper.toDto(post));
  }
}
