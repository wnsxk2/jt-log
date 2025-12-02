import { type Database } from "@/database.types";

export type PostEntity = {
  id: number;
  content: string;
  likeCount: number;
  authorId: string;
  createdAt: string;
  imageUrls: string[] | null;
};

export type ProfileEntity = {
  id: string;
  nickname: string;
  bio: string;
  avatarUrl: string;
};

export type CommentEntity = {
  authorId: string;
  content: string;
  createdAt: string;
  id: number;
  parentCommentId: number | null;
  postId: number;
  rootCommentId: number | null;
  updatedAt: string;
};

export type Post = PostEntity & { author: ProfileEntity; isLiked: boolean };

export type Comment = CommentEntity & { author: ProfileEntity };

export type NestedComment = Comment & {
  parentComment?: Comment;
  children: NestedComment[];
};

export type UseMutationCallback = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onMutate?: () => void;
  onSettled?: () => void;
};

export type Theme = "system" | "dark" | "light";
