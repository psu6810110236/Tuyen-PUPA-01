"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Clock, Leaf, Activity, Flame } from "lucide-react";
import { inventoryAPI, nutritionAPI, type InventoryItem, type TodaySummary } from "@/lib/api";

export default function HomeView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<TodaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryData, nutritionData] = await Promise.all([
          inventoryAPI.getAll(),
          nutritionAPI.getToday(),
        ]);
        setItems(inventoryData);
        setNutritionSummary(nutritionData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Listen to nutrition update events
    const handleNutritionUpdate = () => {
      fetchData();
    };
    window.addEventListener("nutrition-update", handleNutritionUpdate);

    return () => {
      window.removeEventListener("nutrition-update", handleNutritionUpdate);
    };
  }, []);

  const calculateDaysLeft = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return 999; // No expiry date -> Fresh
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffTime;
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'dairy': return '🥛';
      case 'produce': return '🥬';
      case 'meat': return '🍗';
      case 'fruit': return '🍎';
      case 'vegetable': return '🥕';
      default: return '📦';
    }
  };

  // ─── Loading Skeleton ───
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <div className="h-4 w-48 rounded-full bg-surface-alt animate-pulse" />
          <div className="mt-2 h-7 w-36 rounded-full bg-surface-alt animate-pulse" />
        </div>
        <div className="grid gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-outline bg-surface p-6 shadow-card">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-surface-alt animate-pulse" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-24 rounded-full bg-surface-alt animate-pulse" />
                  <div className="h-3 w-16 rounded-full bg-surface-alt animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Process items
  const processedItems = items.map((item) => ({
    ...item,
    daysLeft: calculateDaysLeft(item.expiry_date),
    icon: getCategoryIcon(item.category),
  }));

  const expiringSoon = processedItems.filter((item) => item.daysLeft <= 4).sort((a, b) => a.daysLeft - b.daysLeft);
  const freshItems = processedItems.filter((item) => item.daysLeft > 4).sort((a, b) => a.daysLeft - b.daysLeft);

  // Get Thai date
  const today = new Date();
  const thaiDate = today.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* ─── Date & Greeting ─── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-body text-foreground-muted">{thaiDate}</p>
          <h2 className="mt-1 text-2xl font-heading font-bold text-foreground">ตู้เย็นของคุณ</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200/50 shadow-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-body font-medium text-amber-700">
            {expiringSoon.length} ใกล้หมดอายุ
          </span>
        </div>
      </div>

      {/* ─── Nutrition Summary Widget ─── */}
      {nutritionSummary && (
        <section className="rounded-2xl border border-outline bg-surface p-5 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-heading font-semibold text-foreground">การบริโภคอาหารวันนี้</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Calorie Circle / Large Progress */}
            <div className="flex items-center gap-4 bg-surface-alt rounded-2xl p-4 border border-outline/30">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="url(#calorieGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(1, (nutritionSummary.totals.calories || 0) / (nutritionSummary.goals.calories || 2000)))}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-body text-foreground-secondary font-medium">พลังงานที่ได้รับ</span>
                <span className="text-xl font-heading font-extrabold text-foreground mt-0.5">
                  {Math.round(nutritionSummary.totals.calories).toLocaleString()} <span className="text-xs font-normal text-foreground-muted">/ {Math.round(nutritionSummary.goals.calories).toLocaleString()} kcal</span>
                </span>
                <span className="text-[10px] font-body font-semibold text-primary mt-1">
                  สำเร็จแล้ว {Math.round(nutritionSummary.progress_percentage.calories_pct)}%
                </span>
              </div>
            </div>

            {/* Macronutrients Progress */}
            <div className="flex flex-col gap-3">
              {/* Protein */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-body font-medium">
                  <span className="text-foreground-secondary">โปรตีน</span>
                  <span className="text-foreground font-bold">
                    {Math.round(nutritionSummary.totals.protein)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(nutritionSummary.goals.protein)}g</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
                  <div
                    style={{ width: `${Math.min(100, nutritionSummary.progress_percentage.protein_pct)}%` }}
                    className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-body font-medium">
                  <span className="text-foreground-secondary">คาร์โบไฮเดรต</span>
                  <span className="text-foreground font-bold">
                    {Math.round(nutritionSummary.totals.carb)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(nutritionSummary.goals.carb)}g</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
                  <div
                    style={{ width: `${Math.min(100, nutritionSummary.progress_percentage.carb_pct)}%` }}
                    className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out"
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-body font-medium">
                  <span className="text-foreground-secondary">ไขมัน</span>
                  <span className="text-foreground font-bold">
                    {Math.round(nutritionSummary.totals.fat)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(nutritionSummary.goals.fat)}g</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
                  <div
                    style={{ width: `${Math.min(100, nutritionSummary.progress_percentage.fat_pct)}%` }}
                    className="h-full rounded-full bg-rose-500 transition-all duration-1000 ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Expiring Soon Section ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-5 w-5 text-danger" />
          <h3 className="text-sm font-heading font-semibold text-foreground">ควรทานก่อน (1-4 วัน หรือหมดอายุแล้ว)</h3>
        </div>
        
        {expiringSoon.length === 0 ? (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card text-center">
            <p className="text-sm font-body text-foreground-muted">ไม่มีอาหารใกล้หมดอายุ 🥳</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expiringSoon.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-outline bg-surface p-4 shadow-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-red-light text-2xl">
                  {item.icon}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-heading font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs font-body text-foreground-secondary">
                    {item.quantity} {item.unit} {item.category ? `• ${item.category}` : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-body font-medium ${item.daysLeft < 0 ? 'bg-danger text-white' : 'bg-accent-red text-danger'}`}>
                    {item.daysLeft < 0 ? `หมดอายุแล้ว ${Math.abs(item.daysLeft)} วัน` : `อีก ${item.daysLeft} วัน`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Fresh Items Section ─── */}
      <section className="flex flex-col gap-3 mt-2">
        <div className="flex items-center gap-2 px-1">
          <Leaf className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-heading font-semibold text-foreground">สดใหม่ (&gt; 5 วัน)</h3>
        </div>

        {freshItems.length === 0 ? (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card text-center">
            <p className="text-sm font-body text-foreground-muted">ยังไม่มีอาหารสดใหม่</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {freshItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-outline bg-surface p-4 shadow-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-pale text-2xl">
                  {item.icon}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-heading font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs font-body text-foreground-secondary">
                    {item.quantity} {item.unit} {item.category ? `• ${item.category}` : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {item.daysLeft === 999 ? (
                    <span className="text-sm font-body font-medium text-primary-dark">
                      สดใหม่
                    </span>
                  ) : (
                    <span className="text-sm font-body font-medium text-primary-dark">
                      {item.daysLeft} วัน
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* ─── Empty Spacer for Bottom Nav FAB ─── */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
