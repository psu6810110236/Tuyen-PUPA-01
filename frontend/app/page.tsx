"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import AuthPage from "@/components/views/AuthPage";
import HomeView from "@/components/views/HomeView";
import ScannerView from "@/components/views/ScannerView";
import RecipeView from "@/components/views/RecipeView";
import ChatView from "@/components/views/ChatView";

// ─── View Type ───
type ViewType = "home" | "scanner" | "recipe" | "chat";

// ─── Navigation Items ───
const navItems: { id: ViewType; label: string; icon: string }[] = [
  { id: "home", label: "หน้าหลัก", icon: "🏠" },
  { id: "scanner", label: "สแกนวัตถุดิบ", icon: "📷" },
  { id: "recipe", label: "สูตรอาหาร", icon: "🍳" },
  { id: "chat", label: "แชทกับ AI", icon: "💬" },
];

// ─── Weekly Summary Stats ───
const weeklyStats = [
  { label: "แคลอรี่เฉลี่ย", value: "1,850", unit: "kcal", color: "bg-primary-pale text-primary-dark" },
  { label: "โปรตีนเฉลี่ย", value: "82", unit: "g", color: "bg-accent-lavender text-purple-600" },
  { label: "น้ำดื่ม", value: "2.1", unit: "ลิตร", color: "bg-secondary-light text-surface-tint" },
  { label: "ออกกำลังกาย", value: "4", unit: "วัน", color: "bg-accent-green text-teal-700" },
];

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>("home");

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-soft-blue">
            <span className="text-3xl font-heading font-bold text-white">T</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-body text-foreground-muted">กำลังโหลด...</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Authenticated → Show Login ───
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // ─── Greeting based on time ───
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  // ─── Render Active View ───
  const renderView = () => {
    switch (activeView) {
      case "home":
        return <HomeView />;
      case "scanner":
        return <ScannerView />;
      case "recipe":
        return <RecipeView />;
      case "chat":
        return <ChatView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Header Bar ─── */}
      <header className="sticky top-0 z-50 border-b-2 border-white bg-surface/80 backdrop-blur-md shadow-soft-blue">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <span className="text-lg font-heading font-bold text-white">T</span>
            </div>
            <h1 className="text-lg font-heading font-semibold text-foreground">
              TUYEN
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-2xl p-2 text-foreground-secondary transition-airy hover:bg-surface-alt">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"></span>
            </button>
            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-body font-medium text-foreground-secondary transition-airy hover:bg-accent-red hover:text-danger"
              title="ออกจากระบบ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-24 lg:pb-6">
        {/* ─── Left Column: Dynamic Content ─── */}
        <main className="flex-1 min-w-0 animate-fade-in">
          {renderView()}
        </main>

        {/* ─── Right Column: Sticky Sidebar ─── */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-[73px] flex flex-col gap-5">
            {/* ── Profile Greeting Card ── */}
            <div className="rounded-2xl border-2 border-white bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-soft-blue">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl">
                  👋
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-white/80">{greeting}</p>
                  <h2 className="text-lg font-heading font-semibold">
                    คุณ{user?.username || "ผู้ใช้"}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm font-body leading-relaxed text-white/70">
                วันนี้คุณรับประทานอาหารได้ดีมาก! เหลืออีกแค่ 350 kcal ก็ครบเป้าหมาย
              </p>
            </div>

            {/* ── Weekly Summary Stats ── */}
            <div className="rounded-2xl border-2 border-white bg-surface p-5 shadow-soft-blue">
              <h3 className="mb-4 text-sm font-heading font-semibold text-foreground">📊 สรุปประจำสัปดาห์</h3>
              <div className="grid grid-cols-2 gap-3">
                {weeklyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl ${stat.color} p-3 transition-airy hover-lift`}
                  >
                    <p className="text-xs font-body font-medium opacity-80">{stat.label}</p>
                    <p className="mt-1 text-lg font-heading font-bold">
                      {stat.value}
                      <span className="ml-1 text-xs font-body font-normal opacity-60">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Navigation ── */}
            <div className="rounded-2xl border-2 border-white bg-surface p-5 shadow-soft-blue">
              <h3 className="mb-4 text-sm font-heading font-semibold text-foreground">🧭 เมนูลัด</h3>
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-body font-medium transition-airy ${
                      activeView === item.id
                        ? "bg-primary-pale text-primary-dark shadow-soft-blue"
                        : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                    {activeView === item.id && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Daily Tip Card ── */}
            <div className="rounded-2xl border-2 border-white bg-accent-yellow-light p-5 shadow-soft-blue">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="text-sm font-heading font-semibold text-foreground">เคล็ดลับวันนี้</h3>
                  <p className="mt-1.5 text-sm font-body leading-relaxed text-foreground-secondary">
                    การดื่มน้ำก่อนมื้ออาหาร 30 นาที ช่วยให้ระบบย่อยอาหารทำงานได้ดีขึ้น
                    และช่วยควบคุมปริมาณอาหารที่รับประทาน
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white bg-surface/90 backdrop-blur-md shadow-soft-blue lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-airy ${
                activeView === item.id
                  ? "text-primary-dark"
                  : "text-foreground-muted"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-body font-medium">{item.label}</span>
              {activeView === item.id && (
                <span className="h-1 w-6 rounded-full bg-primary"></span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
