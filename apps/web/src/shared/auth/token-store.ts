const ACCESS_TOKEN_KEY = "fitcore_access_token";
const REFRESH_TOKEN_KEY = "fitcore_refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function loadTokensFromStorage(): void {
  if (typeof window === "undefined") return;
  accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(next: {
  accessToken: string;
  refreshToken: string;
}): void {
  accessToken = next.accessToken;
  refreshToken = next.refreshToken;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, next.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, next.refreshToken);
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
