"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authAPI, APIError } from "@/lib/api";

// ─── Types ───
interface AuthUser {
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ───
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด token จาก localStorage ตอนเริ่มต้น
  useEffect(() => {
    const savedToken = localStorage.getItem("tuyen_token");
    const savedUser = localStorage.getItem("tuyen_user");
    if (savedToken && savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("tuyen_user");
      }
    }
    setIsLoading(false);
  }, []);

  // ฟัง event auth:logout จาก api.ts เมื่อ token หมดอายุ
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem("tuyen_token", data.access_token);
    localStorage.setItem("tuyen_user", JSON.stringify({ username }));
    localStorage.removeItem("tuyen_active_view");
    setToken(data.access_token);
    setUser({ username });
  }, []);

  const loginGoogle = useCallback(async (credential: string) => {
    const data = await authAPI.loginGoogle(credential);
    let username = "Google User";
    try {
      const payloadBase64 = data.access_token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      if (payload && payload.sub) {
        username = payload.sub;
      }
    } catch (e) {
      console.error("Failed to parse Google JWT payload:", e);
    }
    localStorage.setItem("tuyen_token", data.access_token);
    localStorage.setItem("tuyen_user", JSON.stringify({ username }));
    localStorage.removeItem("tuyen_active_view");
    setToken(data.access_token);
    setUser({ username });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    await authAPI.register(username, password);
    // สมัครเสร็จแล้ว auto-login ให้เลย
    await login(username, password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ถ้า logout API fail ก็ยังทำ client-side logout ปกติ
    }
    localStorage.removeItem("tuyen_token");
    localStorage.removeItem("tuyen_user");
    localStorage.removeItem("tuyen_active_view");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { APIError };
