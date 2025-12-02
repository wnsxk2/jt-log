import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

/**
 * Prisma가 반환하는 Comment + User 관계 데이터의 정확한 타입
 */
export type CommentWithUser = Prisma.CommentGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 게시글의 댓글 목록 조회
   * @param postId 게시글 ID
   * @returns 댓글 목록 (작성자 정보 포함, 최신순 정렬)
   */
  async getCommentsByPostId(postId: number): Promise<CommentWithUser[]> {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
      },
    });

    return comments;
  }

  /**
   * 댓글 생성
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID
   * @param createCommentDto 댓글 생성 정보
   * @returns 생성된 댓글
   */
  async createComment(
    postId: number,
    currentUserId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentWithUser> {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 대댓글인 경우 부모 댓글 존재 확인
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }

      // 부모 댓글이 같은 게시글의 댓글인지 확인
      if (parentComment.postId !== postId) {
        throw new NotFoundException('해당 게시글의 댓글이 아닙니다.');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        postId,
        authorId: currentUserId,
        rootCommentId: createCommentDto.rootCommentId,
        parentCommentId: createCommentDto.parentCommentId,
      },
      include: {
        user: true,
      },
    });

    return comment;
  }

  /**
   * 댓글 수정
   * @param commentId 댓글 ID
   * @param currentUserId 현재 로그인한 사용자 ID
   * @param updateCommentDto 수정할 내용
   * @returns 수정된 댓글
   */
  async updateComment(
    commentId: number,
    currentUserId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentWithUser> {
    // 댓글 존재 및 작성자 확인
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.authorId !== currentUserId) {
      throw new ForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: updateCommentDto.content },
      include: {
        user: true,
      },
    });

    return updatedComment;
  }

  /**
   * 댓글 삭제
   * @param commentId 댓글 ID
   * @param currentUserId 현재 로그인한 사용자 ID
   * @returns 삭제된 댓글 정보
   */
  async deleteComment(
    commentId: number,
    currentUserId: string,
  ): Promise<CommentWithUser> {
    // 댓글 존재 및 작성자 확인
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
      },
    });

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.authorId !== currentUserId) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return existingComment;
  }
}
