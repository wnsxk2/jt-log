import Fallback from "@/components/fallback";
import Loader from "@/components/loader";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/store/session";
import defaultAvatar from "@/assets/default-avatar.jpg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfileEditorModal } from "@/store/profile-editor.modal";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useUpdateProfile } from "@/hooks/mutations/profile/use-update-profile";
import { toast } from "sonner";
import { useMyProfileData } from "@/hooks/queries/use-my-profile-data";

type Image = { file: File; previewUrl: string };

export default function ProfileEditorModal() {
  const session = useSession();
  const {
    data: profile,
    error: fetchProfileError,
    isPending: isFetchProfilePending,
  } = useMyProfileData();

  const {
    isOpen,
    actions: { close },
  } = useProfileEditorModal();

  const { mutate: updateProfile, isPending: isUpdateProfilePending } =
    useUpdateProfile({
      onSuccess: () => {
        close();
      },
      onError: (error) => {
        toast.error("프로필 수정에 실패했습니다.", {
          position: "top-center",
        });
      },
    });

  const [avatarImage, setAvatarImage] = useState<Image | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (avatarImage) URL.revokeObjectURL(avatarImage.previewUrl);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && profile) {
      setNickname(profile.nickname);
      setBio(profile.bio);
      setAvatarImage(null);
    }
  }, []);

  const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];

    if (avatarImage) URL.revokeObjectURL(avatarImage.previewUrl);

    setAvatarImage({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleUpdateClick = () => {
    if (nickname.trim() === "") return;
    updateProfile({
      userId: session!.user.id,
      nickname,
      bio,
      avatarImageFile: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="flex flex-col gap-5">
        <DialogTitle>프로필 수정하기</DialogTitle>
        {fetchProfileError && <Fallback />}
        {isFetchProfilePending && <Loader />}
        {!isFetchProfilePending && !fetchProfileError && (
          <>
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground">프로필 이미지</div>
              <input
                disabled={isUpdateProfilePending}
                onChange={handleSelectImage}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
              <img
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                src={
                  avatarImage?.previewUrl || profile.avatarUrl || defaultAvatar
                }
                alt=""
                className="h-20 w-20 cursor-pointer rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground">닉네임</div>
              <Input
                disabled={isUpdateProfilePending}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground">소개</div>
              <Input
                disabled={isUpdateProfilePending}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                }}
              />
            </div>
            <Button
              disabled={isUpdateProfilePending}
              className="cursor-pointer"
              onClick={handleUpdateClick}
            >
              수정하기
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
