import { request } from "./client";
import type { AuthResponse, GameSettings, GameView, MyGame, User } from "./types";

const g = (code: string) => `/api/games/${encodeURIComponent(code)}`;

export const authApi = {
  register: (email: string, username: string, password: string) =>
    request<AuthResponse>("POST", "/api/auth/register", { email, username, password }),
  login: (login: string, password: string) => request<AuthResponse>("POST", "/api/auth/login", { login, password }),
  guest: (displayName: string) => request<AuthResponse>("POST", "/api/auth/guest", { displayName }),
  me: () => request<User>("GET", "/api/auth/me"),
};

export const gamesApi = {
  create: (settings: GameSettings) => request<{ code: string }>("POST", "/api/games", settings),
  mine: () => request<MyGame[]>("GET", "/api/games/mine"),
  get: (code: string) => request<GameView>("GET", g(code)),
  join: (code: string) => request<{ code: string }>("POST", `${g(code)}/join`),
  leave: (code: string) => request("POST", `${g(code)}/leave`),
  action: (code: string, targetId: string | null) => request("POST", `${g(code)}/action`, { targetId }),
  ready: (code: string) => request("POST", `${g(code)}/ready`),
  // yönetici
  updateSettings: (code: string, settings: GameSettings) => request("PUT", `${g(code)}/settings`, settings),
  kick: (code: string, playerId: string) => request("POST", `${g(code)}/kick/${playerId}`),
  start: (code: string) => request("POST", `${g(code)}/start`),
  abort: (code: string) => request("POST", `${g(code)}/abort`),
  rematch: (code: string) => request("POST", `${g(code)}/rematch`),
};
