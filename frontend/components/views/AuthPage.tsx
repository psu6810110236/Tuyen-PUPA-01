"use client";

import { useState } from "react";
import { useAuth, APIError } from "@/components/AuthContext";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน กรุณาลองใหม่");
      return;
    }

    if (password.length < 4) {
      setError("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        await register(username, password);
        setShowSuccess(true);
      } else {
        await login(username, password);
      }
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* ─── Background Decorations ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-lavender/20 blur-3xl" />
      </div>

      {/* ─── Auth Card ─── */}
      <div className="relative z-10 w-full max-w-[420px] animate-fade-in">
        {/* Logo + App Name */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-soft-blue">
            <span className="text-3xl font-heading font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            TUYEN
          </h1>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            ผู้ช่วยจัดการตู้เย็นและโภชนาการอัจฉริยะ
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border-2 border-white bg-surface p-8 shadow-soft-blue">
          {/* Mode Toggle Tabs */}
          <div className="mb-6 flex rounded-full border-2 border-white bg-surface-alt p-1 shadow-soft-blue">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-heading font-semibold transition-airy ${
                mode === "login"
                  ? "bg-primary text-white shadow-soft-blue"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-heading font-semibold transition-airy ${
                mode === "register"
                  ? "bg-primary text-white shadow-soft-blue"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border-2 border-accent-red bg-accent-red px-4 py-3 animate-scale-in">
              <span className="text-base">⚠️</span>
              <p className="text-sm font-body font-medium text-danger">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border-2 border-accent-green bg-accent-green px-4 py-3 animate-scale-in">
              <span className="text-base">✅</span>
              <p className="text-sm font-body font-medium text-success">
                สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-username" className="text-sm font-body font-medium text-foreground">
                👤 ชื่อผู้ใช้
              </label>
              <input
                id="auth-username"
                type="text"
                placeholder="กรอกชื่อผู้ใช้งาน"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-sm font-body font-medium text-foreground">
                🔒 รหัสผ่าน
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
              />
            </div>

            {/* Confirm Password (Register only) */}
            {mode === "register" && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label htmlFor="auth-confirm-password" className="text-sm font-body font-medium text-foreground">
                  🔒 ยืนยันรหัสผ่าน
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex items-center justify-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-dark py-3.5 text-base font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังดำเนินการ...
                </>
              ) : mode === "login" ? (
                "เข้าสู่ระบบ"
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* Switch Mode Link */}
          <p className="mt-6 text-center text-sm font-body text-foreground-secondary">
            {mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-primary hover:text-primary-dark transition-airy"
            >
              {mode === "login" ? "สมัครสมาชิกเลย" : "เข้าสู่ระบบ"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs font-body text-foreground-muted">
          🛡️ ข้อมูลของคุณถูกเข้ารหัสและปลอดภัย
        </p>
      </div>
    </div>
  );
}
