import React from "react";
import { Activity, Flame, Pencil } from "lucide-react";
import { type TodaySummary } from "@/lib/api";

type NutritionWidgetProps = {
  nutritionSummary: TodaySummary;
  setShowGoalModal: (val: boolean) => void;
  currentCalGoal: number;
  calPct: number;
  currentProteinGoal: number;
  proteinPct: number;
  currentCarbGoal: number;
  carbPct: number;
  currentFatGoal: number;
  fatPct: number;
};

export default function NutritionWidget({
  nutritionSummary,
  setShowGoalModal,
  currentCalGoal,
  calPct,
  currentProteinGoal,
  proteinPct,
  currentCarbGoal,
  carbPct,
  currentFatGoal,
  fatPct,
}: NutritionWidgetProps) {
  return (
    <section className="rounded-2xl border border-outline bg-surface p-5 shadow-card animate-fade-in">
      {/* Card header: title left, settings gear right */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary shrink-0" />
        <h3 className="text-sm font-heading font-semibold text-foreground">การบริโภคอาหารวันนี้</h3>
        <button
          onClick={() => setShowGoalModal(true)}
          className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-foreground-muted hover:bg-blue-50 hover:text-blue-500 active:scale-90 active:bg-blue-100 transition-all"
          title="แก้ไขเป้าหมายแคลอรี่"
          aria-label="แก้ไขเป้าหมายแคลอรี่"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
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
                strokeDashoffset={2 * Math.PI * 34 * (1 - (calPct / 100))}
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
              {Math.round(nutritionSummary.totals.calories).toLocaleString()} <span className="text-xs font-normal text-foreground-muted">/ {Math.round(currentCalGoal).toLocaleString()} kcal</span>
            </span>
            <span className="text-[10px] font-body font-semibold text-primary mt-1">
              สำเร็จแล้ว {Math.round(calPct)}%
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
                {Math.round(nutritionSummary.totals.protein)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(currentProteinGoal)}g</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
              <div
                style={{ width: `${proteinPct}%` }}
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-body font-medium">
              <span className="text-foreground-secondary">คาร์โบไฮเดรต</span>
              <span className="text-foreground font-bold">
                {Math.round(nutritionSummary.totals.carb)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(currentCarbGoal)}g</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
              <div
                style={{ width: `${carbPct}%` }}
                className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out"
              />
            </div>
          </div>

          {/* Fat */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-body font-medium">
              <span className="text-foreground-secondary">ไขมัน</span>
              <span className="text-foreground font-bold">
                {Math.round(nutritionSummary.totals.fat)}g <span className="text-[10px] font-normal text-foreground-muted">/ {Math.round(currentFatGoal)}g</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden border border-outline/10">
              <div
                style={{ width: `${fatPct}%` }}
                className="h-full rounded-full bg-rose-500 transition-all duration-1000 ease-out"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
