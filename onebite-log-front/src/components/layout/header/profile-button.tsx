import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession } from "@/store/session";
import defaultAvatar from "@/assets/default-avatar.jpg";
import { PopoverClose } from "@radix-ui/react-popover";
import { Link } from "react-router";
import { signOut } from "@/api/auth";
import { useMyProfileData } from "@/hooks/queries/use-my-profile-data";
import { useSignOut } from "@/hooks/mutations/auth/use-sign-out";

export default function ProfileButton() {
  const session = useSession();
  const { data: profile } = useMyProfileData();
  const { mutate: signOut, isPending: isSignOutPending } = useSignOut();

  const handleSignOutClick = () => {
    signOut();
  };

  if (!session) return null;
  return (
    <Popover>
      <PopoverTrigger>
        <img
          className="h-6 w-6 cursor-pointer rounded-full object-cover"
          src={profile?.avatarUrl || defaultAvatar}
          alt=""
        />
      </PopoverTrigger>
      <PopoverContent className="flex w-40 flex-col p-0">
        <PopoverClose asChild>
          <Link to={`/profile/${session.user.id}`}>
            <div className="hover:bg-muted cursor-pointer px-4 py-3 text-sm">
              프로필
            </div>
          </Link>
        </PopoverClose>
        <PopoverClose asChild>
          <div
            className="hover:bg-muted cursor-pointer px-4 py-3 text-sm"
            onClick={handleSignOutClick}
          >
            로그아웃
          </div>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
