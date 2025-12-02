import { fetchProfile } from "@/api/profile";
import { QUERY_KEYS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

export function useProfileData(userId?: string) {
  return useQuery({
    queryFn: () => fetchProfile(userId!),
    queryKey: QUERY_KEYS.profile.byId(userId!),
    enabled: !!userId,
  });
}
