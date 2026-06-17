"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";
import AuthPage from "@/components/views/AuthPage";
import HomeView from "@/components/views/HomeView";
import ScannerView from "@/components/views/ScannerView";
import RecipeView from "@/components/views/RecipeView";
import ChatView from "@/components/views/ChatView";
import InventoryView from "@/components/views/InventoryView";
import SavedRecipesView from "@/components/views/SavedRecipesView";
import SettingsView from "@/components/views/SettingsView";
import { Home, Camera, ChefHat, MessageSquare, LogOut, Package, Lightbulb, Heart, Settings } from "lucide-react";
import { nutritionAPI, type TodaySummary, type NutritionLog } from "@/lib/api";

// ─── View Type ───
type ViewType = "home" | "inventory" | "scanner" | "recipe" | "chat" | "saved" | "settings";

// ─── Navigation Items ───
const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "หน้าหลัก (Dashboard)", icon: <Home className="h-5 w-5" /> },
  { id: "inventory", label: "คลังอาหาร (Inventory)", icon: <Package className="h-5 w-5" /> },
  { id: "saved", label: "บันทึกไว้ (Saved)", icon: <Heart className="h-5 w-5" /> },
  { id: "scanner", label: "สแกน (Smart Scan)", icon: <Camera className="h-5 w-5" /> },
  { id: "recipe", label: "สูตรอาหาร (Recipes)", icon: <ChefHat className="h-5 w-5" /> },
  { id: "chat", label: "แชท AI (AI Assistant)", icon: <MessageSquare className="h-5 w-5" /> },
  { id: "settings", label: "ตั้งค่า (Settings)", icon: <Settings className="h-5 w-5" /> },
];

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>("home");
  // ─── Page Transition State ───
  const [displayedView, setDisplayedView] = useState<ViewType>("home");
  const [transitionClass, setTransitionClass] = useState("");
  const prevViewRef = useRef<ViewType>("home");
  const isTransitioning = useRef(false);
  const VIEW_ORDER: ViewType[] = ["home", "inventory", "saved", "scanner", "recipe", "chat", "settings"];

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

  useEffect(() => {
    const savedView = localStorage.getItem("tuyen_active_view") as ViewType;
    if (savedView && ["home", "inventory", "scanner", "recipe", "chat", "saved", "settings"].includes(savedView)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveView(savedView);
    }
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    if (view === activeView || isTransitioning.current) return;
    localStorage.setItem("tuyen_active_view", view);

    const prevIdx = VIEW_ORDER.indexOf(prevViewRef.current);
    const nextIdx = VIEW_ORDER.indexOf(view);
    const direction = nextIdx >= prevIdx ? "right" : "left";
    prevViewRef.current = view;
    isTransitioning.current = true;

    // Trigger exit animation on current, then swap & enter new
    setTransitionClass(direction === "right" ? "page-exit-left" : "page-exit-right");

    setTimeout(() => {
      setDisplayedView(view);
      setActiveView(view);
      setTransitionClass(direction === "right" ? "page-enter-right" : "page-enter-left");
      setTimeout(() => {
        setTransitionClass("");
        isTransitioning.current = false;
      }, 350);
    }, 180);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

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

  // ─── Render Active View ───
  const renderView = () => {
    switch (displayedView) {
      case "home":
        return <HomeView />;
      case "inventory":
        return <InventoryView />;
      case "scanner":
        return <ScannerView />;
      case "recipe":
        return <RecipeView />;
      case "chat":
        return <ChatView />;
      case "saved":
        return <SavedRecipesView />;
      case "settings":
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  // ─── Filter Mobile Nav Items ───
  const mobileNavItems = navItems;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Header Bar ─── */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Desktop Logo */}
            <img src="/g1.png" alt="TUYEN Logo" className="hidden sm:block h-8 w-auto object-contain" />
            {/* Mobile/Responsive Logo */}
            <img src="/g2.png" alt="TUYEN Logo" className="block sm:hidden h-8 w-8 object-contain" />
            <h1 className="text-lg font-heading font-bold text-foreground tracking-tight block sm:hidden">
              TUYEN
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Logout Button */}
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
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-24 lg:pb-6">
        {/* ─── Left Column: Dynamic Content ─── */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className={`view-transition-container ${transitionClass}`}>
            {renderView()}
          </div>
        </main>

        {/* ─── Right Column: Sticky Sidebar ─── */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-[73px] flex flex-col gap-5">
            {/* ── Profile Greeting Card (Liquid Light Blue) ── */}
            <div className="rounded-xl border border-blue-100/80 bg-gradient-to-tr from-blue-50 via-sky-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-body uppercase tracking-wider text-blue-600/80 font-bold">
                  {greeting}
                </span>
                <h2 className="text-base font-heading font-extrabold text-blue-950 tracking-tight mt-0.5">
                  คุณ{user?.username || "ผู้ใช้"}
                </h2>
                <p className="mt-2 text-xs font-body leading-relaxed text-blue-900/80 border-t border-blue-100/50 pt-2">
                  {greetingSubtext}
                </p>
              </div>
            </div>

            {/* ── Weekly Summary Stats ── */}
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <h3 className="mb-4 text-xs font-heading font-semibold text-foreground">สรุปประจำสัปดาห์</h3>
              <div className="grid grid-cols-2 gap-3">
                {weeklyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl ${stat.color} p-3 transition-airy hover-lift`}
                  >
                    <p className="text-[10px] font-body font-medium opacity-85">{stat.label}</p>
                    <p className="mt-1 text-base font-heading font-bold">
                      {stat.value}
                      <span className="ml-1 text-[10px] font-body font-normal opacity-70">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Navigation ── */}
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <h3 className="mb-4 text-xs font-heading font-semibold text-foreground">เมนู</h3>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2 text-left text-xs font-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-95 ${
                      activeView === item.id
                        ? "bg-primary text-white shadow-sm font-semibold"
                        : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
                    {item.label}
                    {activeView === item.id && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>
                    )}
                  </button>
                ))}
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
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2 relative">
          {mobileNavItems.map((item) => {
            // Render the massive FAB in the middle (scanner)
            if (item.id === "scanner") {
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  aria-label={item.label}
                  className="no-tap-scale fab-glow relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white border-2 border-surface transition-transform hover:scale-105 active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <Camera className="h-7 w-7" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                aria-label={item.label}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-airy active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-pale ${
                  activeView === item.id
                    ? "text-primary-dark"
                    : "text-foreground-muted hover:text-foreground-secondary"
                }`}
              >
                <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
                <span className="text-[10px] font-body font-medium">{item.label.split(" ")[0]}</span>
                {activeView === item.id && (
                  <span className="absolute bottom-1 h-1 w-6 rounded-full bg-primary"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
