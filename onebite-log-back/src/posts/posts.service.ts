import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageRequestDto } from 'src/common/dto/page-reqest.dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/posts/dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Prisma가 반환하는 Post + 관계 데이터의 정확한 타입
 * include 옵션에 따라 user와 likes가 포함된 결과 타입을 명시
 */
export type PostWithUserAndLikes = Prisma.PostGetPayload<{
  include: { user: true; likes: true };
}>;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 게시글 목록 조회
   * @param currentUserId 현재 로그인한 사용자 ID (좋아요 여부 확인용)
   * @param pageRequestDto 페이징 정보 (page, limit, authorId)
   * @returns 게시글 목록 (작성자 정보 + 현재 사용자의 좋아요 포함)
   */
  async getPosts(
    currentUserId: string,
    pageRequestDto: PageRequestDto,
  ): Promise<PostWithUserAndLikes[]> {
    const { limit, offset, authorId } = pageRequestDto;

    const posts = await this.prisma.post.findMany({
      where: authorId
        ? {
            authorId: authorId, // authorId가 있으면 특정 유저의 게시글만 조회
          }
        : undefined, // authorId가 없으면 모든 게시글 조회
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
        likes: {
          where: {
            userId: currentUserId,
          },
        },
      },
    });

    return posts;
  }

  /**
   * 게시글 상세 조회
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID (좋아요 여부 확인용)
   * @returns 게시글 (작성자 정보 + 현재 사용자의 좋아요 포함)
   * @throws NotFoundException 게시글이 존재하지 않는 경우
   */
  async getPostById(
    postId: number,
    currentUserId: string,
  ): Promise<PostWithUserAndLikes> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        likes: {
          where: {
            userId: currentUserId,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return post;
  }

  /**
   * 새 게시글 생성
   * @param currentUserId 현재 로그인한 사용자 ID (작성자로 지정)
   * @param createPostDto 게시글 생성 정보
   * @returns 생성된 게시글 (작성자 정보 포함)
   */
  async createPost(
    currentUserId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostWithUserAndLikes> {
    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        // 이미지 URL 배열을 JSON 문자열로 변환하여 저장
        imageUrls: createPostDto.imageUrls
          ? JSON.stringify(createPostDto.imageUrls)
          : null,
        authorId: currentUserId,
      },
      include: {
        user: true,
        likes: true,
      },
    });

    return post;
  }

  /**
   * 게시글 수정
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID (작성자 확인용)
   * @param updatePostDto 수정할 내용
   * @returns 수정된 게시글
   * @throws NotFoundException 게시글이 존재하지 않는 경우
   * @throws ForbiddenException 작성자가 아닌 경우
   */
  async updatePost(
    postId: number,
    currentUserId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostWithUserAndLikes> {
    // 게시글 존재 및 작성자 확인
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (existingPost.authorId !== currentUserId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 수정할 수 있습니다.',
      );
    }

    // 게시글 수정
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(updatePostDto.content && { content: updatePostDto.content }),
        ...(updatePostDto.imageUrls && {
          imageUrls: JSON.stringify(updatePostDto.imageUrls),
        }),
      },
      include: {
        user: true,
        likes: {
          where: {
            userId: currentUserId,
          },
        },
      },
    });

    return updatedPost;
  }

  /**
   * 게시글 삭제
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID (작성자 확인용)
   * @returns 삭제된 게시글 정보
   * @throws NotFoundException 게시글이 존재하지 않는 경우
   * @throws ForbiddenException 작성자가 아닌 경우
   */
  async deletePost(
    postId: number,
    currentUserId: string,
  ): Promise<PostWithUserAndLikes> {
    // 게시글 존재 및 작성자 확인
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        likes: true,
      },
    });

    if (!existingPost) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (existingPost.authorId !== currentUserId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 삭제할 수 있습니다.',
      );
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return existingPost;
  }

  /**
   * 게시글 좋아요
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID
   * @returns 좋아요가 반영된 게시글
   * @throws NotFoundException 게시글이 존재하지 않는 경우
   */
  async likePost(
    postId: number,
    currentUserId: string,
  ): Promise<PostWithUserAndLikes> {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 이미 좋아요한 경우 중복 생성 방지 (upsert 사용)
    // 좋아요 생성 + 좋아요 수 증가를 트랜잭션으로 처리
    await this.prisma.$transaction(async (tx) => {
      // 기존 좋아요 확인
      const existingLike = await tx.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
      });

      // 이미 좋아요한 경우 아무것도 하지 않음
      if (existingLike) {
        return;
      }

      // 좋아요 생성
      await tx.like.create({
        data: {
          postId,
          userId: currentUserId,
        },
      });

      // 좋아요 수 증가
      await tx.post.update({
        where: { id: postId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });
    });

    // 업데이트된 게시글 반환
    return this.getPostById(postId, currentUserId);
  }

  /**
   * 게시글 좋아요 취소
   * @param postId 게시글 ID
   * @param currentUserId 현재 로그인한 사용자 ID
   * @returns 좋아요가 취소된 게시글
   * @throws NotFoundException 게시글이 존재하지 않는 경우
   */
  async unlikePost(
    postId: number,
    currentUserId: string,
  ): Promise<PostWithUserAndLikes> {
    // 게시글 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // 좋아요 삭제 + 좋아요 수 감소를 트랜잭션으로 처리
    await this.prisma.$transaction(async (tx) => {
      // 기존 좋아요 확인
      const existingLike = await tx.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
      });

      // 좋아요가 없으면 아무것도 하지 않음
      if (!existingLike) {
        return;
      }

      // 좋아요 삭제
      await tx.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
      });

      // 좋아요 수 감소 (0 미만이 되지 않도록)
      await tx.post.update({
        where: { id: postId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });
    });

    // 업데이트된 게시글 반환
    return this.getPostById(postId, currentUserId);
  }

  /**
   * 전체 게시글 수 조회 (페이징 메타 정보용)
   * @param authorId 작성자 ID (옵셔널, 특정 유저의 게시글 수만 조회할 때 사용)
   * @returns 전체 게시글 개수
   */
  async countPosts(authorId?: string): Promise<number> {
    return this.prisma.post.count({
      where: authorId
        ? {
            authorId: authorId,
          }
        : undefined,
    });
  }
}
