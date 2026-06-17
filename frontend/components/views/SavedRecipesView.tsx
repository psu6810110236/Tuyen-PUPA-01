"use client";

import { useState, useEffect, useCallback } from "react";
import {
  recipeAPI,
  type RecipeSaved,
  type RecipeDetail,
} from "@/lib/api";
import {
  ChefHat,
  Heart,
  Trash2,
  ArrowRight,
  ChevronLeft,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  MessageCircle,
  Search,
  Info
} from "lucide-react";

export default function SavedRecipesView() {
  const [savedList, setSavedList] = useState<RecipeSaved[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<RecipeDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // ─── Load Saved Recipes ───
  const loadSavedRecipes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await recipeAPI.getSaved();
      setSavedList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load saved recipes:", err);
      setError("ไม่สามารถโหลดเมนูที่บันทึกไว้ได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedRecipes();
  }, [loadSavedRecipes]);

  // ─── Unsave Recipe from List ───
  const handleUnsave = async (spoonacularId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await recipeAPI.deleteSaved(spoonacularId);
      setSavedList(prev => prev.filter(r => r.spoonacular_id !== spoonacularId));
      setActionMessage("ลบสูตรอาหารออกจากรายการโปรดเรียบร้อยแล้ว ✅");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      console.error("Failed to delete saved recipe:", err);
      setActionMessage("ไม่สามารถลบสูตรอาหารได้ ❌");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // ─── Open Recipe Detail ───
  const openDetail = async (spoonacularId: number) => {
    setIsLoadingDetail(true);
    setError("");
    try {
      const detail = await recipeAPI.getDetail(spoonacularId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error("Failed to load recipe detail:", err);
      setError("ไม่สามารถโหลดรายละเอียดเมนูได้");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ─── Unsave from Detail View ───
  const handleUnsaveFromDetail = async (spoonacularId: number) => {
    try {
      await recipeAPI.deleteSaved(spoonacularId);
      setSavedList(prev => prev.filter(r => r.spoonacular_id !== spoonacularId));
      setSelectedDetail(null);
      setActionMessage("ลบสูตรอาหารออกจากรายการโปรดเรียบร้อยแล้ว ✅");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      console.error("Failed to delete saved recipe:", err);
      setActionMessage("ไม่สามารถลบสูตรอาหารได้ ❌");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // ─── Cook Recipe ───
  const handleCook = async (recipeId: number) => {
    try {
      const res = await recipeAPI.cook(recipeId);
      if (res.success) {
        setActionMessage(`🍳 ทำอาหารสำเร็จ! ตัดสต็อกวัตถุดิบและบันทึก ${res.logged_nutrition.calories} kcal เข้าประวัติของคุณแล้ว`);
        setTimeout(() => setActionMessage(""), 5000);
        window.dispatchEvent(new Event("nutrition-update"));
        // รีเฟรชหน้าต่างรายละเอียดเผื่อเช็ควัตถุดิบใหม่หลังหักสต็อก
        openDetail(recipeId);
      } else {
        setActionMessage("ไม่สามารถดำเนินการทำอาหารได้ ❌");
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to cook recipe:", err);
      setActionMessage("ไม่สามารถหักลบวัตถุดิบได้ ❌");
      setTimeout(() => setActionMessage(""), 3000);
    }
  };

  // ─── Render Recipe Detail ───
  if (selectedDetail) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-12">
        {/* Back Button */}
        <button
          onClick={() => setSelectedDetail(null)}
          className="flex items-center gap-2 self-start rounded-2xl px-4 py-2 text-sm font-body font-medium text-foreground-secondary transition-airy hover:bg-surface-alt hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับไปเมนูที่บันทึก
        </button>

        {/* Message Banner */}
        {actionMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 animate-scale-in">
            <p className="text-sm font-body font-medium text-emerald-800">{actionMessage}</p>
          </div>
        )}

        {/* Detail Header Card */}
        <div className="rounded-2xl border border-outline bg-surface overflow-hidden shadow-card">
          {selectedDetail.image && (
            <img src={selectedDetail.image} alt={selectedDetail.title} className="h-56 w-full object-cover" />
          )}
          <div className="p-6">
            <h2 className="text-xl font-heading font-bold text-foreground">{selectedDetail.title}</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-pale px-3 py-1.5 text-xs font-body font-medium text-primary-dark">
                <Clock className="h-3 w-3" /> {selectedDetail.readyInMinutes} นาที
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary-light px-3 py-1.5 text-xs font-body font-medium text-surface-tint">
                <Users className="h-3 w-3" /> {selectedDetail.servings} ที่
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {/* Unsave Button */}
              <button
                onClick={() => handleUnsaveFromDetail(selectedDetail.id)}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-heading font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" /> ลบออกจากรายการโปรด
              </button>

              {/* Cook Button */}
              <button
                onClick={() => handleCook(selectedDetail.id)}
                disabled={selectedDetail.missing_ingredients && selectedDetail.missing_ingredients.length > 0}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-heading font-semibold text-white transition-colors ${
                  selectedDetail.missing_ingredients && selectedDetail.missing_ingredients.length > 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                }`}
              >
                <ChefHat className="h-4 w-4" /> ลงมือทำอาหาร (ตัดสต็อก)
              </button>

              {selectedDetail.missing_ingredients && selectedDetail.missing_ingredients.length > 0 && (
                <span className="text-xs text-danger font-body flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> วัตถุดิบไม่ครบ ไม่สามารถปรุงได้
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients section */}
        {((selectedDetail.available_ingredients && selectedDetail.available_ingredients.length > 0) ||
          (selectedDetail.missing_ingredients && selectedDetail.missing_ingredients.length > 0)) && (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" /> ส่วนผสม (Ingredients)
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">เปรียบเทียบกับวัตถุดิบในตู้เย็นของคุณโดยอัตโนมัติ</p>
            </div>

            {/* Available (Green) */}
            {selectedDetail.available_ingredients && selectedDetail.available_ingredients.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-heading font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" /> มีแล้วในตู้เย็น ({selectedDetail.available_ingredients.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDetail.available_ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-emerald-50/50 border border-emerald-100 px-4 py-3">
                      <span className="text-sm font-body font-medium text-emerald-800 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> {ing.name}
                      </span>
                      <span className="text-xs font-body text-emerald-600">{ing.amount} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing (Red) */}
            {selectedDetail.missing_ingredients && selectedDetail.missing_ingredients.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-heading font-semibold text-danger flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" /> ต้องซื้อเพิ่ม ({selectedDetail.missing_ingredients.length})
                  </h4>
                  {selectedDetail.line_share_url && (
                    <a
                      href={selectedDetail.line_share_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3.5 py-1.5 text-xs font-heading font-bold text-white shadow-sm transition-airy hover:bg-[#05B34C] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="h-3 w-3" /> ส่งรายการซื้อเข้า LINE
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDetail.missing_ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-red-50/50 border border-red-100 px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-body font-medium text-red-800 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-500" /> {ing.name}
                        </span>
                        {ing.lotus_search_url && (
                          <a
                            href={ing.lotus_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline mt-0.5"
                          >
                            <Search className="h-2 w-2 mr-1" /> ค้นหาใน Lotus&apos;s
                          </a>
                        )}
                      </div>
                      <span className="text-xs font-body text-red-600 font-semibold">{ing.amount} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {selectedDetail.instructions && (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card">
            <h3 className="mb-4 text-sm font-heading font-semibold text-foreground flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary" /> วิธีทำ
            </h3>
            <div
              className="prose prose-sm max-w-none text-sm font-body leading-relaxed text-foreground-secondary"
              dangerouslySetInnerHTML={{ __html: selectedDetail.instructions }}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Render List of Saved Recipes ───
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">เมนูที่บันทึก (Saved Recipes)</h2>
        <p className="mt-1 text-xs font-body text-foreground-secondary">
          เข้าถึงเมนูโปรดของคุณได้อย่างรวดเร็ว เพื่อการวางแผนมื้ออาหารที่สะดวกขึ้น
        </p>
      </div>

      {/* Action Banner */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 animate-scale-in">
          <p className="text-sm font-body font-medium text-emerald-800">{actionMessage}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Info className="h-4 w-4 text-red-500" />
          <p className="text-sm font-body text-red-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-outline bg-surface shadow-card">
              <div className="h-40 bg-surface-alt animate-pulse" />
              <div className="p-5">
                <div className="h-4 w-3/4 rounded-full bg-surface-alt animate-pulse" />
                <div className="mt-3 h-3 w-1/2 rounded-full bg-surface-alt animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : isLoadingDetail ? (
        <div className="flex flex-col items-center justify-center p-12">
          <svg className="h-8 w-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-body text-foreground-muted mt-3">กำลังเปิดรายละเอียดเมนู...</span>
        </div>
      ) : savedList.length === 0 ? (
        <div className="rounded-xl border border-outline bg-surface p-12 text-center shadow-card">
          <Heart className="h-10 w-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm font-body text-foreground-muted">ยังไม่มีสูตรอาหารที่บันทึกไว้</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedList.map((recipe, index) => (
            <div
              key={recipe.id}
              onClick={() => openDetail(recipe.spoonacular_id)}
              className="stagger-item group cursor-pointer flex flex-col justify-between overflow-hidden rounded-xl border border-outline bg-surface shadow-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div>
                {/* Recipe Image preview */}
                <div className="relative h-36 bg-gradient-to-br from-primary-pale to-secondary-light overflow-hidden">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-sky-50/50">
                      <ChefHat className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={(e) => handleUnsave(recipe.spoonacular_id, e)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600"
                    title="ลบออกจากรายการโปรด"
                  >
                    <Heart className="h-4 w-4 fill-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <h4 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors text-base line-clamp-2 min-h-[3rem]">
                    {recipe.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-3 text-xs font-body text-foreground-secondary">
                    {recipe.ready_in_minutes && recipe.ready_in_minutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {recipe.ready_in_minutes} นาที
                      </span>
                    )}
                    {recipe.servings && recipe.servings > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {recipe.servings} ที่
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mx-4 mb-4 border-t border-outline/50 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-body text-primary font-semibold flex items-center gap-1">
                  ดูวิธีทำอาหาร <ArrowRight className="h-3 w-3" />
                </span>
                <ChefHat className="h-4 w-4 text-foreground-muted opacity-40" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
