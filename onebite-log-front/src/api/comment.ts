import { fetchApi } from "@/lib/api";
import type { Comment } from "@/types";

export async function createComment({
  postId,
  content,
  parentCommentId,
  rootCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId?: number;
  rootCommentId?: number;
}) {
  const response = await fetchApi<Comment>(`/posts/${postId}/comments`, {
    method: "POST",
    hasToken: true,
    body: JSON.stringify({
      content,
      parentCommentId,
      rootCommentId,
    }),
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to create comment");
  }

  return response.data;
}

export async function fetchComments(postId: number) {
  const response = await fetchApi<Comment[]>(`/posts/${postId}/comments`, {
    method: "GET",
    hasToken: true,
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to fetch comments");
  }

  return response.data;
}

export async function updateComment({
  id,
  content,
}: {
  id: number;
  content: string;
}) {
  const response = await fetchApi<Comment>(`/comments/${id}`, {
    method: "PATCH",
    hasToken: true,
    body: JSON.stringify({ content }),
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to update comment");
  }

  return response.data;
}

export async function deleteComment(id: number) {
  const response = await fetchApi<Comment>(`/comments/${id}`, {
    method: "DELETE",
    hasToken: true,
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to delete comment");
  }

  return response.data;
}
