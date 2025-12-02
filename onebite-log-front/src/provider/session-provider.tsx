import GlobalLoader from "@/components/global-loader";
import { useRefreshAccessToken } from "@/hooks/mutations/auth/use-refresh-access-token";
import { useMyProfileData } from "@/hooks/queries/use-my-profile-data";
import { useIsSessionLoaded, useSession, useSetSession } from "@/store/session";
import { useEffect, type ReactNode } from "react";

export default function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const isSessionLoaded = useIsSessionLoaded();
  const { data: profile, isLoading: isProfileLoading } = useMyProfileData();
  const { mutate: refreshAccessToken, isPending: isRefreshingAccessToken } =
    useRefreshAccessToken();

  useEffect(() => {
    if (!session) {
      refreshAccessToken();
    }
  }, []);

  const isLoading = isProfileLoading || isRefreshingAccessToken;

  if (!isSessionLoaded) return <GlobalLoader />;
  if (isLoading) return <GlobalLoader />;

  return children;
}
