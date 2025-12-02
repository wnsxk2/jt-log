import { createComment } from "@/api/comment";
import { useMyProfileData } from "@/hooks/queries/use-my-profile-data";
import { QUERY_KEYS } from "@/lib/constants";
import type { Comment, UseMutationCallback } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateComment(callbacks?: UseMutationCallback) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfileData();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (newComment) => {
      if (callbacks?.onSuccess) callbacks.onSuccess();
      queryClient.setQueryData<Comment[]>(
        QUERY_KEYS.comment.post(newComment.postId),
        (comments) => {
          if (!comments)
            throw new Error("댓글이 캐시 데이터에 보관되어있지 않습니다.");

          if (!profile)
            throw new Error("사용자의 프로필 정보를 찾을 수 없습니다.");
          return [...comments, { ...newComment, author: profile }];
        },
      );
    },
    onError: (error) => {
      if (callbacks?.onError) callbacks.onError(error);
    },
  });
}
