export type UserRole = "ADMIN" | "TRAINER" | "FRONT_DESK" | "MEMBER";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}
