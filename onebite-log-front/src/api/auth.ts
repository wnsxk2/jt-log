import { fetchApi } from "@/lib/api";
import supabase from "@/lib/supabase";
import type { Provider } from "@supabase/supabase-js";

export async function signUp({
  email,
  password,
  nickname,
}: {
  email: string;
  password: string;
  nickname: string;
}) {
  const response = await fetchApi<{
    id: string;
    email: string;
    nickname: string;
    message: string;
  }>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      nickname,
    }),
  });

  return response.data;
}

export async function signInWithPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const response = await fetchApi<{
    id: string;
    email: string;
    accessToken: string;
  }>("/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.data!;
}

export async function signInWithOAuth(provider: Provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
  });
  if (error) throw error;
  return data;
}

export async function requestPasswordResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_PUBLIC_URL}/reset-password`,
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const response = await fetchApi<{ message: string }>("/auth/logout", {
    method: "POST",
  });

  if (response.result === "error") {
    throw new Error(response.error?.message || "Failed to sign out");
  }

  return response.data;
}

export async function refreshAccessToken() {
  const response = await fetchApi<{
    id: string;
    email: string;
    accessToken: string;
  }>("/auth/refresh", {
    method: "POST",
  });

  return response.data!;
}
