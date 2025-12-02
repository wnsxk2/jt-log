import { togglePostLike } from "@/api/post";
import { QUERY_KEYS } from "@/lib/constants";
import type { Post, UseMutationCallback } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useTogglePostLike(callbacks?: UseMutationCallback) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePostLike,
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.post.byId(postId),
      });

      const prevPost = queryClient.getQueryData<Post>(
        QUERY_KEYS.post.byId(postId),
      );

      queryClient.setQueryData<Post>(QUERY_KEYS.post.byId(postId), (post) => {
        if (!post) throw new Error("post가 존재하지 않습니다.");
        return {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
        };
      });

      return {
        prevPost,
      };
    },
    onSuccess: async () => {
      if (callbacks?.onSuccess) callbacks.onSuccess();
    },
    onError: (error, _, context) => {
      if (context && context.prevPost) {
        queryClient.setQueryData<Post>(
          QUERY_KEYS.post.byId(context.prevPost.id),
          context.prevPost,
        );
      }
      if (callbacks?.onError) callbacks.onError(error);
    },
  });
}
