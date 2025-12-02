import { fetchMyProfile } from "@/api/profile";
import { QUERY_KEYS } from "@/lib/constants";
import { useSession } from "@/store/session";

import { useQuery } from "@tanstack/react-query";

export function useMyProfileData() {
  const session = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryFn: fetchMyProfile,
    queryKey: QUERY_KEYS.profile.byId(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 5분 동안 데이터를 fresh 상태로 유지
  });
}
