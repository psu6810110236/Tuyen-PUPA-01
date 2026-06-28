"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import AuthPage from "@/components/views/AuthPage";
import { Home, Camera, ChefHat, MessageSquare, LogOut, Package, Lightbulb, Heart, Settings, Bookmark } from "lucide-react";
import { nutritionAPI, type TodaySummary, type NutritionLog } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "หน้าหลัก (Dashboard)", icon: <Home className="h-5 w-5" /> },
  { href: "/inventory", label: "คลังอาหาร (Inventory)", icon: <Package className="h-5 w-5" /> },
  { href: "/saved", label: "เมนูที่บันทึก (Saved Recipes)", icon: <Heart className="h-5 w-5" /> },
  { href: "/scanner", label: "สแกน (Smart Scan)", icon: <Camera className="h-5 w-5" /> },
  { href: "/recipes", label: "สูตรอาหาร (Recipes)", icon: <ChefHat className="h-5 w-5" /> },
  { href: "/chat", label: "แชท AI (TUYEN AI)", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/settings", label: "ตั้งค่า (Settings)", icon: <Settings className="h-5 w-5" /> },
];

const mobileNavItems = [
  { href: "/", label: "หน้าหลัก", icon: <Home className="h-5 w-5" /> },
  { href: "/inventory", label: "คลังอาหาร", icon: <Package className="h-5 w-5" /> },
  { href: "/scanner", label: "สแกน", icon: <Camera className="h-5 w-5" /> },
  { href: "/recipes", label: "สูตรอาหาร", icon: <ChefHat className="h-5 w-5" /> },
  { href: "/chat", label: "แชท AI", icon: <MessageSquare className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const pathname = usePathname() || "/";

  // ─── Nutrition Stats State ───
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [historyLogs, setHistoryLogs] = useState<NutritionLog[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const loadNutritionData = async () => {
      try {
        const [today, history] = await Promise.all([
          nutritionAPI.getToday(),
          nutritionAPI.getHistory(7),
        ]);
        if (active) {
          setTodaySummary(today);
          setHistoryLogs(history);
        }
      } catch (err) {
        console.error("Failed to load nutrition summary:", err);
      }
    };
    loadNutritionData();

    // Listen to nutrition update events
    const handleNutritionUpdate = () => {
      loadNutritionData();
    };
    window.addEventListener("nutrition-update", handleNutritionUpdate);

    return () => {
      active = false;
      window.removeEventListener("nutrition-update", handleNutritionUpdate);
    };
  }, [isAuthenticated]);

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface shadow-card border border-outline p-2">
            <img src="/g2.png" alt="Loading" className="h-full w-full object-contain animate-pulse" />
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

  // ─── Calculate daily averages from 7 days history ───
  const dailyTotals: Record<string, { calories: number; protein: number }> = {};
  historyLogs.forEach((log) => {
    const dateKey = new Date(log.logged_at).toISOString().split("T")[0];
    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = { calories: 0, protein: 0 };
    }
    dailyTotals[dateKey].calories += log.calories;
    dailyTotals[dateKey].protein += log.protein;
  });

  const daysLogged = Object.keys(dailyTotals).length;
  const avgCalories = daysLogged > 0
    ? Math.round(Object.values(dailyTotals).reduce((sum, day) => sum + day.calories, 0) / daysLogged)
    : todaySummary?.totals.calories || 0;

  const avgProtein = daysLogged > 0
    ? Math.round(Object.values(dailyTotals).reduce((sum, day) => sum + day.protein, 0) / daysLogged)
    : todaySummary?.totals.protein || 0;

  const weeklyStats = [
    { label: "แคลอรี่เฉลี่ย", value: avgCalories > 0 ? avgCalories.toLocaleString() : "0", unit: "kcal", color: "bg-primary-pale text-primary-dark" },
    { label: "โปรตีนเฉลี่ย", value: avgProtein > 0 ? avgProtein.toString() : "0", unit: "g", color: "bg-accent-lavender text-indigo-700" },
    { label: "มื้ออาหารวันนี้", value: todaySummary?.meals_count?.toString() || "0", unit: "มื้อ", color: "bg-secondary-light text-primary" },
    { label: "สำเร็จแล้ว", value: todaySummary ? Math.min(100, Math.round(todaySummary.progress_percentage.calories_pct)).toString() : "0", unit: "%", color: "bg-accent-green text-teal-700" },
  ];

  let greetingSubtext = "บันทึกและติดตามสารอาหารเพื่อเป้าหมายสุขภาพที่ดีของคุณ";
  if (todaySummary) {
    const remaining = todaySummary.goals.calories - todaySummary.totals.calories;
    if (remaining > 0) {
      greetingSubtext = `วันนี้ทานไปแล้ว ${Math.round(todaySummary.totals.calories)} kcal เหลืออีกแค่ ${Math.round(remaining)} kcal จะครบเป้าหมายประจำวัน!`;
    } else if (todaySummary.totals.calories > 0) {
      greetingSubtext = `ยินดีด้วย! วันนี้คุณทานอาหารครบเป้าหมายแคลอรี่เรียบร้อยแล้ว (${Math.round(todaySummary.totals.calories)} kcal)`;
    }
  }

  const isChatPage = pathname === "/chat";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Header Bar ─── */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3 transition-transform active:scale-95">
            <img src="/g1.png" alt="TUYEN Logo" className="hidden sm:block h-8 w-auto object-contain" />
            <img src="/g2.png" alt="TUYEN Logo" className="block sm:hidden h-8 w-8 object-contain" />
            <h1 className="text-lg font-heading font-bold text-foreground tracking-tight block sm:hidden">
              TUYEN
            </h1>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/saved"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-body font-medium transition-airy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                pathname === "/saved"
                  ? "text-primary bg-primary-pale"
                  : "text-foreground-secondary hover:text-primary hover:bg-primary-pale/60"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">เมนูที่บันทึก</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-body font-medium text-foreground-secondary transition-airy hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

        {/* ─── Main Two-Column Layout ─── */}
      <div className={`mx-auto flex max-w-7xl gap-6 lg:px-6 lg:py-6 lg:pb-6 ${
        isChatPage
          ? "px-0 py-0 pb-0"           // Chat: no padding — fills edge-to-edge on mobile
          : "px-6 py-6 pb-24"          // Other views: normal spacing + bottom nav clearance
      }`}>
        {/* ─── Left Column: Dynamic Content ─── */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>

        {/* ─── Right Column: Sticky Sidebar ─── */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-[73px] flex flex-col gap-5">
            {/* ── Profile Greeting Card ── */}
            <div className="rounded-xl border border-blue-100/80 bg-gradient-to-tr from-blue-50 via-sky-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-heading uppercase tracking-wider text-blue-600/90 font-bold">
                  {greeting}
                </span>
                <h2 className="text-xl font-heading font-extrabold text-blue-950 tracking-tight mt-0.5">
                  คุณ{user?.username || "ผู้ใช้"}
                </h2>
                <p className="mt-2.5 text-xs font-body font-medium leading-relaxed text-blue-900/90 border-t border-blue-200/50 pt-2.5">
                  {greetingSubtext}
                </p>
              </div>
            </div>

            {/* ── Weekly Summary Stats ── */}
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <h3 className="mb-4 text-sm font-heading font-bold text-slate-800">สรุปประจำสัปดาห์</h3>
              <div className="grid grid-cols-2 gap-3">
                {weeklyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl ${stat.color} p-3 transition-airy hover-lift`}
                  >
                    <p className="text-xs font-heading font-semibold opacity-90">{stat.label}</p>
                    <p className="mt-1 text-xl font-heading font-extrabold tracking-tight">
                      {stat.value}
                      <span className="ml-1 text-[11px] font-body font-bold opacity-80">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Navigation ── */}
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <h3 className="mb-4 text-xs font-heading font-semibold text-foreground">เมนู</h3>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3.5 py-2 text-left text-xs font-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-95 ${
                        isActive
                          ? "bg-primary text-white shadow-sm font-semibold"
                          : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
                      {item.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ── Daily Tip Card ── */}
            <div className="rounded-xl border border-amber-200/50 bg-amber-50/40 p-5 shadow-card">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-heading font-semibold text-foreground">เคล็ดลับสุขภาพ</h3>
                  <p className="mt-1.5 text-xs font-body leading-relaxed text-foreground-secondary">
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav lg:hidden">
        <div className="mx-auto grid grid-cols-5 items-center justify-items-center w-full max-w-md px-2 py-1">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.href === "/scanner") {
              return (
                <div key={item.href} className="relative flex items-center justify-center">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className="no-tap-scale fab-glow absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white border-[3px] border-white shadow-lg transition-transform hover:scale-105 active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <Camera className="h-6 w-6" />
                  </Link>
                  <span className="h-14 w-14 opacity-0 pointer-events-none" aria-hidden="true" />
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 w-full transition-airy active:scale-90 focus-visible:outline-none ${
                  isActive ? "text-primary" : "text-foreground-muted hover:text-foreground-secondary"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-body font-medium">{item.label}</span>
                {isActive && <span className="h-1 w-4 rounded-full bg-primary mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
