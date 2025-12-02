import { uploadImage } from "@/api/image";
import { fetchApi } from "@/lib/api";
import type { Post, PostEntity } from "@/types";

export async function createPostWithImages({
  content,
  images,
  userId,
}: {
  content: string;
  images: File[];
  userId: string;
}) {
  const post = await createPost(content);
  if (images.length === 0) return post;

  try {
    const imageUrls = await Promise.all(
      images.map((image) => {
        const fileExtension = image.name.split(".").pop() || "webp";
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `${userId}/${post.id}/${fileName}`;
        return uploadImage({ file: image, filePath });
      }),
    );

    const updatedPost = await updatePost({
      id: post.id,
      imageUrls,
    });

    return updatedPost;
  } catch (error) {
    await deletePost(post.id);
    throw error;
  }
}

export async function fetchPosts({
  page,
  limit,
  authorId,
}: {
  page: number;
  limit: number;
  authorId?: string;
}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (authorId) {
    params.append("authorId", authorId);
  }

  const response = await fetchApi<{
    items: Post[];
    meta: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>(`/posts?${params.toString()}`, { hasToken: true });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to fetch posts");
  }

  return response.data;
}

export async function fetchPostById(postId: number) {
  const response = await fetchApi<Post>(`/posts/${postId}`, {
    method: "GET",
    hasToken: true,
  });

  return response.data!;
}

export async function createPost(content: string) {
  const response = await fetchApi<Post>("/posts", {
    method: "POST",
    hasToken: true,
    body: JSON.stringify({ content }),
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to create post");
  }

  return response.data;
}

export async function updatePost(post: Partial<PostEntity> & { id: number }) {
  const { id, ...updateData } = post;
  const response = await fetchApi<Post>(`/posts/${id}`, {
    method: "PATCH",
    hasToken: true,
    body: JSON.stringify(updateData),
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to update post");
  }

  return response.data;
}

export async function deletePost(id: number) {
  const response = await fetchApi<Post>(`/posts/${id}`, {
    method: "DELETE",
    hasToken: true,
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to delete post");
  }

  return response.data;
}

export async function togglePostLike({
  postId,
  isLiked,
}: {
  postId: number;
  isLiked: boolean;
}) {
  const endpoint = `/posts/${postId}/like`;
  const method = isLiked ? "DELETE" : "PATCH";

  const response = await fetchApi<Post>(endpoint, {
    method,
    hasToken: true,
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to toggle post like");
  }

  return response.data;
}
