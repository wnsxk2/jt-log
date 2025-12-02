import { deleteImagesInPath, uploadImage } from "@/api/image";
import { fetchApi } from "@/lib/api";

export async function fetchMyProfile() {
  const response = await fetchApi<{
    id: string;
    nickname: string;
    bio: string;
    avatarUrl: string;
  }>(`/users/me`, {
    method: "GET",
    hasToken: true,
  });

  return response.data!;
}

export async function fetchProfile(userId: string) {
  const response = await fetchApi<{
    id: string;
    nickname: string;
    bio: string;
    avatarUrl: string;
  }>(`/users/${userId}`, {
    method: "GET",
    hasToken: true,
  });

  return response.data!;
}

export async function updateProfile({
  userId,
  nickname,
  bio,
  avatarImageFile,
}: {
  userId: string;
  nickname?: string;
  bio?: string;
  avatarImageFile?: File;
}) {
  if (avatarImageFile) {
    await deleteImagesInPath(`${userId}/avatar`);
  }

  const fileExtension = avatarImageFile?.name.split(".").pop() || "webp";
  const filePath = `${userId}/avatar/${new Date().getTime()}-${crypto.randomUUID()}.${fileExtension}`;

  let newAvatarImageUrl;
  if (avatarImageFile) {
    newAvatarImageUrl = await uploadImage({
      file: avatarImageFile,
      filePath,
    });
  }

  const response = await fetchApi<{
    id: string;
    nickname: string;
    bio: string;
    avatarUrl: string;
  }>(`/users/me`, {
    method: "PATCH",
    hasToken: true,
    body: JSON.stringify({
      nickname,
      bio,
      avatarUrl: newAvatarImageUrl,
    }),
  });

  if (response.result === "error" || !response.data) {
    throw new Error(response.error?.message || "Failed to update profile");
  }

  return response.data;
}
