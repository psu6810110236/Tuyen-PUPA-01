"use client";

import { useState } from "react";
import { useAuth, APIError } from "@/components/AuthContext";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";

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
      </div>

      {/* ─── Auth Card ─── */}
      <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
        {/* Logo + App Name */}
        <div className="mb-6 text-center text-center-logo">
          <img src="/g1.png" alt="TUYEN Logo" className="mx-auto mb-3 h-14 w-auto object-contain" />
        
          <p className="mt-1 text-xs font-body text-foreground-secondary">
            ผู้ช่วยจัดการตู้เย็นและโภชนาการอัจฉริยะของคุณ
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-outline bg-surface p-6 shadow-card">
          {/* Mode Toggle Tabs */}
          <div className="mb-5 flex rounded-lg bg-surface-alt p-1 border border-outline/50">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-md py-2 text-xs font-heading font-semibold transition-airy ${
                mode === "login"
                  ? "bg-surface text-foreground shadow-sm border border-outline/30"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 rounded-md py-2 text-xs font-heading font-semibold transition-airy ${
                mode === "register"
                  ? "bg-surface text-foreground shadow-sm border border-outline/30"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger/5 p-3 animate-scale-in text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-body font-medium leading-normal">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-success/20 bg-success/5 p-3 animate-scale-in text-success">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-body font-medium leading-normal">
                สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-username" className="text-xs font-body font-medium text-foreground-secondary">
                ชื่อผู้ใช้งาน
              </label>
              <input
                id="auth-username"
                type="text"
                placeholder="กรอกชื่อผู้ใช้งาน"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="rounded-lg border border-outline bg-surface-alt px-3.5 py-2 text-sm font-body text-foreground placeholder-foreground-muted transition-airy focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-body font-medium text-foreground-secondary">
                รหัสผ่าน
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="rounded-lg border border-outline bg-surface-alt px-3.5 py-2 text-sm font-body text-foreground placeholder-foreground-muted transition-airy focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Confirm Password (Register only) */}
            {mode === "register" && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label htmlFor="auth-confirm-password" className="text-xs font-body font-medium text-foreground-secondary">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-lg border border-outline bg-surface-alt px-3.5 py-2 text-sm font-body text-foreground placeholder-foreground-muted transition-airy focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-heading font-semibold text-white shadow-sm transition-airy hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <p className="mt-5 text-center text-xs font-body text-foreground-secondary">
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
        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] font-body text-foreground-muted">
          <Shield className="h-3.5 w-3.5" />
          <span>ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัย</span>
        </div>
      </div>
    </div>
  );
}

