import { signInWithPassword } from "@/api/auth";
import { useSetSession } from "@/store/session";
import type { UseMutationCallback } from "@/types";
import { useMutation } from "@tanstack/react-query";

export function useSignInWithPassword(callbacks?: UseMutationCallback) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: signInWithPassword,
    onSuccess: (data) => {
      if (callbacks?.onSuccess) callbacks.onSuccess();

      setSession({
        accessToken: data.accessToken,
        expiresIn: 15 * 60 * 1000,
        expiresAt: Date.now() + 15 * 60 * 1000,
        user: {
          id: data.id,
          email: data.email,
        },
      });
    },
    onError: (error) => {
      if (callbacks?.onError) callbacks.onError(error);
    },
  });
}
