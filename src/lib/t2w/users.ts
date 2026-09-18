import type { CurrentUser } from "./api";

export type ManagedUser = CurrentUser & {
  invitationExpiresAt?: string | null;
  lockedUntil?: string | null;
};
export type UserRole = ManagedUser["role"];
export type UserStatus = ManagedUser["status"];

async function request<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/users${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string | string[] };
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Benutzeraktion fehlgeschlagen.",
    );
  return data;
}

export const apiUsers = (status?: UserStatus) =>
  request<ManagedUser[]>(status ? `?status=${status}` : "");
export const apiInviteUser = (input: {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  financeAccess: boolean;
  organizerId?: string | null;
}) =>
  request<ManagedUser & { activationUrl?: string }>("/invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
export const apiUpdateUser = (id: string, input: Partial<ManagedUser> & { password?: string }) =>
  request<ManagedUser>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const apiResendInvitation = (id: string) =>
  request<{ activationUrl?: string }>(`/${id}/invitation/resend`, { method: "POST" });
export const apiRevokeInvitation = (id: string) =>
  request(`/${id}/invitation`, { method: "DELETE" });
export const apiUnlockUser = (id: string) => request(`/${id}/unlock`, { method: "POST" });
