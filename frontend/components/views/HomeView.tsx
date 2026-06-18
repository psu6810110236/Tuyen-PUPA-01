"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { inventoryAPI, nutritionAPI, type InventoryItem, type TodaySummary } from "@/lib/api";

import NutritionWidget from "./home/NutritionWidget";
import CalorieGoalModal from "./home/CalorieGoalModal";
import InventoryStatusList from "./home/InventoryStatusList";

export default function HomeView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<TodaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Calorie Goal Modal State ───
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [calGoal, setCalGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("130");
  const [carbGoal, setCarbGoal] = useState("220");
  const [fatGoal, setFatGoal] = useState("65");
  const [mounted, setMounted] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Clean up any remaining timeouts on unmount (Harden fix)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Load saved goals from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setCalGoal(localStorage.getItem("goal_calories") || "2000");
      setProteinGoal(localStorage.getItem("goal_protein") || "130");
      setCarbGoal(localStorage.getItem("goal_carbs") || "220");
      setFatGoal(localStorage.getItem("goal_fat") || "65");
    }, 0);
    return () => clearTimeout(timer);
  }, [showGoalModal]);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("goal_calories", calGoal);
    localStorage.setItem("goal_protein", proteinGoal);
    localStorage.setItem("goal_carbs", carbGoal);
    localStorage.setItem("goal_fat", fatGoal);
    setGoalSaved(true);
    
    // Harden: Clear existing timeout and track the new one
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGoalSaved(false);
      setShowGoalModal(false);
    }, 1800);
  };

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

  const getFoodEmoji = (name: string, category: string | null): string => {
    const n = name.toLowerCase();
    if (n.includes("นม") || n.includes("milk")) return "🥛";
    if (n.includes("ไข่") || n.includes("egg")) return "🥚";
    if (n.includes("ไก่") || n.includes("chicken")) return "🍗";
    if (n.includes("หมู") || n.includes("pork")) return "🥩";
    if (n.includes("เนื้อ") || n.includes("beef")) return "🥩";
    if (n.includes("ปลา") || n.includes("fish")) return "🐟";
    if (n.includes("แครอท") || n.includes("carrot")) return "🥕";
    if (n.includes("แอปเปิ้ล") || n.includes("apple")) return "🍎";
    if (n.includes("ผัก") || n.includes("vegetable") || n.includes("spinach") || n.includes("🥬")) return "🥬";
    if (n.includes("ส้ม") || n.includes("orange")) return "🍊";
    if (n.includes("กล้วย") || n.includes("banana")) return "🍌";
    if (n.includes("ชีส") || n.includes("cheese")) return "🧀";
    if (n.includes("ขนมปัง") || n.includes("bread")) return "🍞";
    
    const cat = (category || "").toLowerCase();
    if (cat.includes("dairy")) return "🥛";
    if (cat.includes("produce") || cat.includes("veg") || cat.includes("fruit")) return "🥬";
    if (cat.includes("meat") || cat.includes("poultry") || cat.includes("protein")) return "🥩";
    if (cat.includes("seafood")) return "🐟";
    if (cat.includes("grain")) return "🍞";
    
    return "📦";
  };

  const translateCategory = (category: string | null): string => {
    if (!category) return "อื่นๆ";
    const cat = category.toLowerCase();
    if (cat.includes("dairy")) return "นมและไข่";
    if (cat.includes("produce") || cat.includes("veg") || cat.includes("fruit")) return "ผักผลไม้";
    if (cat.includes("meat") || cat.includes("poultry") || cat.includes("protein")) return "เนื้อสัตว์";
    if (cat.includes("seafood")) return "อาหารทะเล";
    if (cat.includes("grain")) return "ธัญพืช";
    if (cat.includes("pantry")) return "เครื่องปรุง/อาหารแห้ง";
    if (cat.includes("other")) return "อื่นๆ";
    return category;
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

  const processedItems = items.map((item) => ({
    ...item,
    daysLeft: calculateDaysLeft(item.expiry_date),
    icon: getFoodEmoji(item.name, item.category),
    category: translateCategory(item.category),
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

  // ─── Calculate Dynamic Goals & Progress ───
  const currentCalGoal = Number(calGoal) || 2000;
  const currentProteinGoal = Number(proteinGoal) || 130;
  const currentCarbGoal = Number(carbGoal) || 220;
  const currentFatGoal = Number(fatGoal) || 65;

  const calPct = nutritionSummary ? Math.min(100, (nutritionSummary.totals.calories / currentCalGoal) * 100) : 0;
  const proteinPct = nutritionSummary ? Math.min(100, (nutritionSummary.totals.protein / currentProteinGoal) * 100) : 0;
  const carbPct = nutritionSummary ? Math.min(100, (nutritionSummary.totals.carb / currentCarbGoal) * 100) : 0;
  const fatPct = nutritionSummary ? Math.min(100, (nutritionSummary.totals.fat / currentFatGoal) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* ─── Date & Greeting ─── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-body text-foreground-muted">{thaiDate}</p>
          <h2 className="mt-1 text-2xl font-heading font-bold text-foreground">ตู้เย็นของคุณ</h2>
        </div>
        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200/50 shadow-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-body font-medium text-amber-700">
              {expiringSoon.length} ใกล้หมดอายุ
            </span>
          </div>
        )}
      </div>

      {/* ─── Nutrition Summary Widget ─── */}
      {nutritionSummary && (
        <NutritionWidget
          nutritionSummary={nutritionSummary}
          setShowGoalModal={setShowGoalModal}
          currentCalGoal={currentCalGoal}
          calPct={calPct}
          currentProteinGoal={currentProteinGoal}
          proteinPct={proteinPct}
          currentCarbGoal={currentCarbGoal}
          carbPct={carbPct}
          currentFatGoal={currentFatGoal}
          fatPct={fatPct}
        />
      )}

      {/* ─── Inventory Lists ─── */}
      <InventoryStatusList 
        expiringSoon={expiringSoon}
        freshItems={freshItems}
      />
      
      {/* ─── Empty Spacer for Bottom Nav FAB ─── */}
      <div className="h-16 lg:hidden" />

      {/* ─── Calorie Goal Modal ─── */}
      <CalorieGoalModal
        showGoalModal={showGoalModal}
        setShowGoalModal={setShowGoalModal}
        mounted={mounted}
        goalSaved={goalSaved}
        calGoal={calGoal}
        setCalGoal={setCalGoal}
        proteinGoal={proteinGoal}
        setProteinGoal={setProteinGoal}
        carbGoal={carbGoal}
        setCarbGoal={setCarbGoal}
        fatGoal={fatGoal}
        setFatGoal={setFatGoal}
        handleSaveGoals={handleSaveGoals}
      />
    </div>
  );
}
