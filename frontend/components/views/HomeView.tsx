"use client";

import { useState, useEffect } from "react";
import { nutritionAPI, type TodaySummary, type NutritionLog } from "@/lib/api";

export default function HomeView() {
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [recentMeals, setRecentMeals] = useState<NutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [summary, history] = await Promise.all([
        nutritionAPI.getToday(),
        nutritionAPI.getHistory(1), // ดึงมื้ออาหารวันนี้
      ]);
      setTodaySummary(summary);
      setRecentMeals(history);
    } catch (err) {
      console.error("Failed to load nutrition data:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fallback values ───
  const calorieGoal = todaySummary?.goals.calories ?? 2000;
  const calorieConsumed = Math.round(todaySummary?.totals.calories ?? 0);
  const calorieRemaining = Math.max(0, calorieGoal - calorieConsumed);
  const caloriePercent = Math.min(100, (calorieConsumed / calorieGoal) * 100);

  // SVG circle calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriePercent / 100) * circumference;

  // Macro data from API
  const macros = [
    {
      name: "โปรตีน",
      current: Math.round(todaySummary?.totals.protein ?? 0),
      goal: todaySummary?.goals.protein ?? 150,
      unit: "g",
      color: "bg-primary-dark",
      bgColor: "bg-primary-pale",
      textColor: "text-primary-dark",
    },
    {
      name: "คาร์โบไฮเดรต",
      current: Math.round(todaySummary?.totals.carb ?? 0),
      goal: todaySummary?.goals.carb ?? 200,
      unit: "g",
      color: "bg-primary-fixed",
      bgColor: "bg-secondary-light",
      textColor: "text-surface-tint",
    },
    {
      name: "ไขมัน",
      current: Math.round(todaySummary?.totals.fat ?? 0),
      goal: todaySummary?.goals.fat ?? 65,
      unit: "g",
      color: "bg-accent-lavender",
      bgColor: "bg-accent-lavender/30",
      textColor: "text-purple-600",
    },
  ];

  // ─── Meal type emoji/label mapping ───
  const mealTypeMap: Record<string, { icon: string; label: string }> = {
    breakfast: { icon: "🍳", label: "เช้า" },
    lunch: { icon: "🍛", label: "กลางวัน" },
    dinner: { icon: "🥗", label: "เย็น" },
    snack: { icon: "🍪", label: "ของว่าง" },
  };

  // Get Thai date
  const today = new Date();
  const thaiDate = today.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─── Loading Skeleton ───
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <div className="h-4 w-48 rounded-full bg-surface-alt animate-pulse" />
          <div className="mt-2 h-7 w-36 rounded-full bg-surface-alt animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex h-[340px] items-center justify-center rounded-2xl border-2 border-white bg-surface shadow-soft-blue">
            <svg className="h-8 w-8 animate-spin text-primary/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-4 w-24 rounded-full bg-surface-alt animate-pulse" />
                <div className="h-3 w-full rounded-full bg-surface-alt animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Date & Greeting ─── */}
      <div>
        <p className="text-sm font-body text-foreground-muted">{thaiDate}</p>
        <h2 className="mt-1 text-2xl font-heading font-bold text-foreground">ภาพรวมวันนี้</h2>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-accent-red bg-accent-red px-4 py-3">
          <span>⚠️</span>
          <p className="text-sm font-body text-danger">{error}</p>
          <button onClick={loadData} className="ml-auto text-sm font-body font-medium text-primary hover:text-primary-dark">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* ─── Calorie Ring + Macros Row ─── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Circular Calorie Chart */}
        <div className="flex flex-col items-center rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
          <h3 className="mb-4 text-sm font-heading font-semibold text-foreground-secondary">แคลอรี่วันนี้</h3>
          <div className="relative">
            <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
              {/* Background circle */}
              <circle cx="110" cy="110" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
              {/* Progress circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="url(#calorieGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4263EB" />
                  <stop offset="100%" stopColor="#748FFC" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-bold text-foreground">
                {calorieConsumed.toLocaleString()}
              </span>
              <span className="text-sm font-body text-foreground-muted">
                / {calorieGoal.toLocaleString()} kcal
              </span>
              <div className="mt-2 rounded-full bg-primary-pale px-3 py-1">
                <span className="text-xs font-heading font-semibold text-primary-dark">
                  เหลือ {calorieRemaining} kcal
                </span>
              </div>
            </div>
          </div>
          {todaySummary && (
            <p className="mt-3 text-xs font-body text-foreground-muted">
              รับประทานไปแล้ว {todaySummary.meals_count} มื้อวันนี้
            </p>
          )}
        </div>

        {/* Macro Progress Bars */}
        <div className="flex flex-col justify-center gap-5 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
          <h3 className="text-sm font-heading font-semibold text-foreground-secondary">สารอาหารหลัก</h3>
          {macros.map((macro) => {
            const percent = macro.goal > 0 ? Math.min(100, Math.round((macro.current / macro.goal) * 100)) : 0;
            return (
              <div key={macro.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-body font-medium ${macro.textColor}`}>{macro.name}</span>
                  <span className="text-sm font-body text-foreground-muted">
                    {macro.current}
                    {macro.unit} / {macro.goal}
                    {macro.unit}
                  </span>
                </div>
                <div className={`h-3 w-full overflow-hidden rounded-full ${macro.bgColor}`}>
                  <div
                    className={`h-full rounded-full ${macro.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-body text-foreground-muted">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Meals ─── */}
      <div>
        <h3 className="mb-4 text-sm font-heading font-semibold text-foreground">🍽️ มื้ออาหารล่าสุด</h3>
        {recentMeals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-white bg-surface p-8 shadow-soft-blue">
            <span className="text-4xl">🍽️</span>
            <p className="text-sm font-body text-foreground-muted">ยังไม่มีรายการมื้ออาหารวันนี้</p>
            <p className="text-xs font-body text-foreground-muted">ลองบันทึกมื้ออาหารแรกของคุณ!</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentMeals.map((meal) => {
              const mealInfo = mealTypeMap[meal.meal_type] || { icon: "🍽️", label: meal.meal_type };
              const mealTime = new Date(meal.logged_at).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={meal.id}
                  className="flex min-w-[200px] shrink-0 items-center gap-3 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover-lift cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-alt text-2xl">
                    {mealInfo.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-body font-medium text-primary-dark">{mealInfo.label}</span>
                    <span className="text-sm font-heading font-semibold text-foreground">{meal.food_name}</span>
                    <span className="text-xs font-body text-foreground-muted">
                      {Math.round(meal.calories)} kcal · {mealTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
