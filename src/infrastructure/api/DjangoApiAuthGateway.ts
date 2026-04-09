import type { IAuthGateway } from "@/application/ports/IAuthGateway";
import type { User } from "@/domain/models/User";
import { apiFetch } from "./apiClient";
import { keysToCamel } from "./caseTransform";
import {
  clearAuthCookies,
  getRefreshToken,
} from "@/infrastructure/auth/cookies";

export class DjangoApiAuthGateway implements IAuthGateway {
  async getCurrentUser(): Promise<User> {
    const raw = await apiFetch<Record<string, unknown>>("/account/");
    return keysToCamel<User>(raw);
  }

  async signOut(): Promise<void> {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiFetch("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
    await clearAuthCookies();
  }

  async deleteAccount(): Promise<void> {
    await apiFetch("/account/", { method: "DELETE" });
    await clearAuthCookies();
  }
}
