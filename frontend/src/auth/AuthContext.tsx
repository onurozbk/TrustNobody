import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, setAuthToken, setUnauthorizedHandler } from "../api/client";
import { authApi } from "../api/endpoints";
import type { AuthResponse, User } from "../api/types";
import { storage } from "../lib/storage";

const TOKEN_KEY = "tn.token";
const USER_KEY = "tn.user";
const PENDING_INVITE_KEY = "tn.pendingInvite";

interface AuthState {
  user: User | null;
  /** Kayıtlı oturum yüklenene kadar false. */
  ready: boolean;
  login(login: string, password: string): Promise<void>;
  register(email: string, username: string, password: string): Promise<void>;
  /** Kayıt olmadan, sadece takma adla devam et. */
  continueAsGuest(displayName: string): Promise<void>;
  logout(): Promise<void>;
  /** Giriş yapmadan açılan davet linkinin kodu; girişten sonra odaya yönlendirmek için. */
  setPendingInvite(code: string | null): Promise<void>;
  takePendingInvite(): Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(USER_KEY)]);
  }, []);

  const saveSession = useCallback(async (res: AuthResponse) => {
    setAuthToken(res.token);
    setUser(res.user);
    await Promise.all([storage.set(TOKEN_KEY, res.token), storage.set(USER_KEY, JSON.stringify(res.user))]);
  }, []);

  // Açılışta kayıtlı oturumu yükle ve sunucuda doğrula
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    (async () => {
      const [token, userJson] = await Promise.all([storage.get(TOKEN_KEY), storage.get(USER_KEY)]);
      if (token && userJson) {
        setAuthToken(token);
        try {
          setUser(JSON.parse(userJson) as User);
        } catch {
          // bozuk kayıt
        }
        try {
          setUser(await authApi.me());
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) await clearSession();
          // ağ hatasında kayıtlı oturumla devam et
        }
      }
      setReady(true);
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      login: async (login, password) => saveSession(await authApi.login(login, password)),
      register: async (email, username, password) => saveSession(await authApi.register(email, username, password)),
      continueAsGuest: async displayName => saveSession(await authApi.guest(displayName)),
      logout: clearSession,
      setPendingInvite: async code => {
        if (code) await storage.set(PENDING_INVITE_KEY, code);
        else await storage.remove(PENDING_INVITE_KEY);
      },
      takePendingInvite: async () => {
        const code = await storage.get(PENDING_INVITE_KEY);
        if (code) await storage.remove(PENDING_INVITE_KEY);
        return code;
      },
    }),
    [user, ready, saveSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return ctx;
}
