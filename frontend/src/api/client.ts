import { API_URL } from "../lib/config";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

/** Oturum açıkken 401 gelirse çağrılır (token süresi dolmuş vb.). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

export async function request<T = void>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.", 0);
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthorized?.();
    const message =
      (data as { error?: string } | undefined)?.error ??
      (res.status === 429 ? "Çok fazla deneme yaptın, biraz bekle." : `Beklenmeyen bir hata oluştu (${res.status}).`);
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
}
