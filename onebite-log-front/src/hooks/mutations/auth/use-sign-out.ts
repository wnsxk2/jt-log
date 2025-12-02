import { signOut } from "@/api/auth";
import { useSetSession } from "@/store/session";
import type { UseMutationCallback } from "@/types";
import { useMutation } from "@tanstack/react-query";

export function useSignOut(callbacks?: UseMutationCallback) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      if (callbacks?.onSuccess) callbacks.onSuccess();
    },
    onError: (error) => {
      if (callbacks?.onError) callbacks.onError(error);
    },
    onSettled: () => {
      if (callbacks?.onSettled) callbacks.onSettled();
      setSession(null);
    },
  });
}
