import { apiFetch } from "@/shared/api-client/http";
import type { IAuthTokens, IUser } from "@/shared/auth/types";

export interface ILoginInput {
  email: string;
  password: string;
}

export interface ISignupInput {
  name: string;
  email: string;
  password: string;
}

type AuthResponse = IAuthTokens & { user: IUser };

export const authService = {
  login(input: ILoginInput) {
    return apiFetch<AuthResponse>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(input) },
      { auth: false },
    );
  },

  signup(input: ISignupInput) {
    return apiFetch<AuthResponse>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(input) },
      { auth: false },
    );
  },

  me() {
    return apiFetch<IUser>("/auth/me");
  },

  logout(refreshToken: string) {
    return apiFetch<{ message: string }>(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      { auth: false },
    );
  },
};
