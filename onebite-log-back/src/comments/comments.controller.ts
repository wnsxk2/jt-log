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
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators';
import { ResponseDto } from 'src/common/dto/respone.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CommentsMapper } from './comments.mapper';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 댓글 목록 조회
   * - 특정 게시글의 모든 댓글을 조회합니다.
   */
  @Get('posts/:postId/comments')
  @ApiOperation({
    summary: '댓글 목록 조회',
    description: '특정 게시글의 댓글 목록을 조회합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiOkResponse({
    description: '댓글 목록 조회 성공',
    type: [CommentResponseDto],
  })
  @ApiNotFoundResponse({ description: '게시글을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<ResponseDto<CommentResponseDto[]>> {
    const comments = await this.commentsService.getCommentsByPostId(postId);
    return ResponseDto.success(CommentsMapper.toDtoList(comments));
  }

  /**
   * 댓글 작성
   * - 특정 게시글에 댓글을 작성합니다.
   * - 대댓글인 경우 rootCommentId와 parentCommentId를 함께 전달합니다.
   */
  @Post('posts/:postId/comments')
  @ApiOperation({
    summary: '댓글 작성',
    description:
      '특정 게시글에 댓글을 작성합니다. 대댓글인 경우 rootCommentId와 parentCommentId를 함께 전달합니다.',
  })
  @ApiParam({ name: 'postId', description: '게시글 ID', example: 1 })
  @ApiCreatedResponse({
    description: '댓글 작성 성공',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: '게시글 또는 부모 댓글을 찾을 수 없음' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<ResponseDto<CommentResponseDto>> {
    const comment = await this.commentsService.createComment(
      postId,
      userId,
      createCommentDto,
    );
    return ResponseDto.success(CommentsMapper.toDto(comment));
  }

  /**
   * 댓글 수정
   * - 본인이 작성한 댓글만 수정할 수 있습니다.
   */
  @Patch('comments/:commentId')
  @ApiOperation({
    summary: '댓글 수정',
    description: '본인이 작성한 댓글을 수정합니다.',
  })
  @ApiParam({ name: 'commentId', description: '댓글 ID', example: 1 })
  @ApiOkResponse({
    description: '댓글 수정 성공',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
  @ApiForbiddenResponse({ description: '본인이 작성한 댓글이 아님' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('userId') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<ResponseDto<CommentResponseDto>> {
    const comment = await this.commentsService.updateComment(
      commentId,
      userId,
      updateCommentDto,
    );
    return ResponseDto.success(CommentsMapper.toDto(comment));
  }

  /**
   * 댓글 삭제
   * - 본인이 작성한 댓글만 삭제할 수 있습니다.
   */
  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '댓글 삭제',
    description: '본인이 작성한 댓글을 삭제합니다.',
  })
  @ApiParam({ name: 'commentId', description: '댓글 ID', example: 1 })
  @ApiOkResponse({
    description: '댓글 삭제 성공',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: '댓글을 찾을 수 없음' })
  @ApiForbiddenResponse({ description: '본인이 작성한 댓글이 아님' })
  @ApiUnauthorizedResponse({ description: '인증 실패 (토큰 없음 또는 만료)' })
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('userId') userId: string,
  ): Promise<ResponseDto<CommentResponseDto>> {
    const deletedComment = await this.commentsService.deleteComment(
      commentId,
      userId,
    );
    return ResponseDto.success(CommentsMapper.toDto(deletedComment));
  }
}
