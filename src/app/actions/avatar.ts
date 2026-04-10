"use server";

import { getAuthToken } from "@/infrastructure/api/apiClient";
import { AuthError } from "@/domain/errors/AuthError";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export async function uploadAvatar(
  formData: FormData,
): Promise<{ avatarUrl?: string; error?: string }> {
  let token: string;
  try {
    token = await getAuthToken();
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Session expired. Please log in again." };
    }
    return { error: "Upload failed." };
  }

  const res = await fetch(`${API_URL}/api/v1/account/avatar/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { detail?: string };
      return { error: data.detail ?? "Upload failed." };
    }
    return { error: "Upload failed. Please try again." };
  }

  const data = (await res.json()) as { avatar_url: string };
  return { avatarUrl: data.avatar_url };
}

export async function deleteAvatar(): Promise<{ error?: string }> {
  let token: string;
  try {
    token = await getAuthToken();
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Session expired. Please log in again." };
    }
    return { error: "Delete failed." };
  }

  const res = await fetch(`${API_URL}/api/v1/account/avatar/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { detail?: string };
      return { error: data.detail ?? "Delete failed." };
    }
    return { error: "Delete failed. Please try again." };
  }

  return {};
}
