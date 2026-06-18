"use client";

import { useState, useEffect, useCallback } from "react";
import {
  recipeAPI,
  type RecipeSuggestion,
  type RecipeSearchResult,
  type RecipeDetail,
} from "@/lib/api";
import { ChefHat, Clock, Users, Search, Sparkles, ChevronLeft, Save, CheckCircle, AlertTriangle, ShoppingCart, MessageCircle, Info, BookmarkCheck } from "lucide-react";

type ViewMode = "suggest" | "search" | "detail";

export default function RecipeView() {
  const [viewMode, setViewMode] = useState<ViewMode>("suggest");
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<RecipeSearchResult[]>([]);
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await recipeAPI.suggest();
      // handle both array response and {message, recipes} response
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          if (a.missedIngredientCount !== b.missedIngredientCount) {
            return a.missedIngredientCount - b.missedIngredientCount;
          }
          return b.usedIngredientCount - a.usedIngredientCount;
        });
        setSuggestions(sorted);
      } else {
        const obj = data as unknown as { recipes?: RecipeSuggestion[]; message?: string };
        const sorted = [...(obj.recipes || [])].sort((a, b) => {
          if (a.missedIngredientCount !== b.missedIngredientCount) {
            return a.missedIngredientCount - b.missedIngredientCount;
          }
          return b.usedIngredientCount - a.usedIngredientCount;
        });
        setSuggestions(sorted);
        if (obj.message && (!obj.recipes || obj.recipes.length === 0)) {
          setError(obj.message);
        }
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
      setError("ไม่สามารถโหลดเมนูแนะนำได้ — กรุณาเพิ่มวัตถุดิบในตู้เย็นก่อน");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Load suggestions on mount ───
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSuggestions();
  }, [loadSuggestions]);

  // ─── Search recipes ───
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError("");
    setViewMode("search");
    try {
      const data = await recipeAPI.search(searchQuery);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("การค้นหาล้มเหลว กรุณาลองใหม่");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // ─── View recipe detail ───
  const openDetail = async (id: number) => {
    setIsLoading(true);
    setError("");
    try {
      const detail = await recipeAPI.getDetail(id);
      setRecipeDetail(detail);
      try {
        const savedList = await recipeAPI.getSaved();
        setIsSaved(savedList.some(r => r.spoonacular_id === id));
      } catch (e) {
        setIsSaved(false);
      }
      setViewMode("detail");
    } catch (err) {
      console.error("Failed to load recipe detail:", err);
      setError("ไม่สามารถโหลดรายละเอียดเมนูได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Save recipe ───
  const handleSave = async (recipe: { id: number; title: string; image?: string | null; readyInMinutes?: number; servings?: number }) => {
    try {
      await recipeAPI.save({
        spoonacular_id: recipe.id,
        title: recipe.title,
        image_url: recipe.image || undefined,
        ready_in_minutes: recipe.readyInMinutes,
        servings: recipe.servings,
      });
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save recipe:", err);
      setSaveMessage("ไม่สามารถบันทึกเมนูได้ ❌");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // ─── Unsave recipe ───
  const handleUnsave = async (recipeId: number) => {
    try {
      await recipeAPI.deleteSaved(recipeId);
      setIsSaved(false);
    } catch (err) {
      console.error("Failed to unsave recipe:", err);
      setSaveMessage("ไม่สามารถลบออกจากรายการที่บันทึกได้ ❌");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // ─── Cook recipe ───
  const handleCook = async (recipeId: number) => {
    try {
      const res = await recipeAPI.cook(recipeId);
      if (res.success) {
        setSaveMessage(`🍳 ทำอาหารสำเร็จ! ตัดสต็อกตู้เย็นและบันทึก ${res.logged_nutrition.calories} kcal ลงประวัติคุณแล้ว!`);
        setTimeout(() => setSaveMessage(""), 5000);
        // ส่ง event แจ้งเตือนหน้าอื่นให้ดึงข้อมูลสารอาหารใหม่
        window.dispatchEvent(new Event("nutrition-update"));
        // รีโหลดเมนูแนะนำเพราะของในตู้เย็นลดลงไปแล้ว
        loadSuggestions();
      } else {
        setSaveMessage("ไม่สามารถดำเนินการทำอาหารได้ ❌");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to cook recipe:", err);
      setSaveMessage("ไม่สามารถหักลบวัตถุดิบได้ ❌");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // ─── Back to list ───
  const goBack = () => {
    setRecipeDetail(null);
    setViewMode(searchQuery.trim() ? "search" : "suggest");
  };

  // ─── Search on Enter ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ─── Recipe Detail View ───
  if (viewMode === "detail" && recipeDetail) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 self-start rounded-2xl px-4 py-2 text-sm font-body font-medium text-foreground-secondary transition-airy hover:bg-surface-alt hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับไปรายการ
        </button>

        {/* Notification Message */}
        {saveMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 animate-scale-in">
            <p className="text-sm font-body font-medium text-emerald-800">{saveMessage}</p>
          </div>
        )}

        {/* Recipe Header */}
        <div className="rounded-2xl border border-outline bg-surface overflow-hidden shadow-card">
          {recipeDetail.image && (
            <img src={recipeDetail.image} alt={recipeDetail.title} className="h-56 w-full object-cover" />
          )}
          <div className="p-6">
            <h2 className="text-xl font-heading font-bold text-foreground">{recipeDetail.title}</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-pale px-3 py-1.5 text-xs font-body font-medium text-primary-dark">
                <Clock className="h-3 w-3" /> {recipeDetail.readyInMinutes} นาที
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary-light px-3 py-1.5 text-xs font-body font-medium text-surface-tint">
                <Users className="h-3 w-3" /> {recipeDetail.servings} ที่
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {/* Save Button */}
              <button
                onClick={() => isSaved ? handleUnsave(recipeDetail.id) : handleSave(recipeDetail)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-heading font-semibold shadow-sm transition-all ${
                  isSaved
                    ? "bg-primary-pale/30 text-primary-dark border-2 border-primary-light hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    : "bg-primary text-white hover:bg-primary-dark border-2 border-transparent"
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" /> บันทึกแล้ว
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> บันทึกเมนูนี้
                  </>
                )}
              </button>

              {/* Cook Button */}
              <button
                onClick={() => handleCook(recipeDetail.id)}
                disabled={recipeDetail.missing_ingredients && recipeDetail.missing_ingredients.length > 0}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-heading font-semibold text-white transition-colors ${
                  recipeDetail.missing_ingredients && recipeDetail.missing_ingredients.length > 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                }`}
              >
                <ChefHat className="h-4 w-4" /> ลงมือทำอาหาร (ตัดสต็อก)
              </button>

              {recipeDetail.missing_ingredients && recipeDetail.missing_ingredients.length > 0 && (
                <span className="text-xs text-danger font-body flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> วัตถุดิบไม่ครบ ไม่สามารถปรุงได้
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {((recipeDetail.available_ingredients && recipeDetail.available_ingredients.length > 0) ||
          (recipeDetail.missing_ingredients && recipeDetail.missing_ingredients.length > 0) ||
          (recipeDetail.extendedIngredients && recipeDetail.extendedIngredients.length > 0)) && (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" /> ส่วนผสม (Ingredients)
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">เปรียบเทียบกับวัตถุดิบในตู้เย็นของคุณโดยอัตโนมัติ</p>
            </div>

            {/* Available Ingredients (Green) */}
            {recipeDetail.available_ingredients && recipeDetail.available_ingredients.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-heading font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" /> มีแล้วในตู้เย็น ({recipeDetail.available_ingredients.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recipeDetail.available_ingredients.map((ing, i) => (
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

            {/* Missing Ingredients (Red / Shopping List) */}
            {recipeDetail.missing_ingredients && recipeDetail.missing_ingredients.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-heading font-semibold text-danger flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" /> ต้องซื้อเพิ่ม ({recipeDetail.missing_ingredients.length})
                  </h4>
                  {recipeDetail.line_share_url && (
                    <a
                      href={recipeDetail.line_share_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3.5 py-1.5 text-xs font-heading font-bold text-white shadow-sm transition-airy hover:bg-[#05B34C] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="h-3 w-3" /> ส่งรายการซื้อเข้า LINE
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recipeDetail.missing_ingredients.map((ing, i) => (
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

            {/* Fallback for extended ingredients (if no match) */}
            {!recipeDetail.available_ingredients && !recipeDetail.missing_ingredients && recipeDetail.extendedIngredients && (
              <div className="flex flex-col gap-2">
                {recipeDetail.extendedIngredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-surface-alt px-4 py-2.5">
                    <span className="text-sm">•</span>
                    <span className="text-sm font-body text-foreground">
                      {ing.name} — {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {recipeDetail.instructions && (
          <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card mb-12">
            <h3 className="mb-4 text-sm font-heading font-semibold text-foreground flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary" /> วิธีทำ
            </h3>
            <div
              className="prose prose-sm max-w-none text-sm font-body leading-relaxed text-foreground-secondary"
              dangerouslySetInnerHTML={{ __html: recipeDetail.instructions }}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Recipe List View (Suggestions or Search Results) ───
  const displayRecipes = viewMode === "search" ? searchResults : suggestions;
  const isListLoading = viewMode === "search" ? isSearching : isLoading;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">สูตรอาหาร</h2>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            {viewMode === "suggest"
              ? "เมนูแนะนำจากวัตถุดิบในตู้เย็นของคุณ"
              : `ผลการค้นหา "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-accent-green bg-accent-green px-4 py-3 animate-scale-in">
          <p className="text-sm font-body font-medium text-success">{saveMessage}</p>
        </div>
      )}

      {/* ─── Search Bar ─── */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="ค้นหาสูตรอาหาร... (ภาษาอังกฤษ เช่น chicken salad)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-outline bg-surface py-3 pl-12 pr-4 text-sm font-body text-foreground placeholder-foreground-muted transition-colors focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
          className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-heading font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          ค้นหา
        </button>
      </div>

      {/* ─── Mode Tabs ─── */}
      <div className="flex gap-2">
        <button
          onClick={() => { setViewMode("suggest"); loadSuggestions(); }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body font-medium transition-colors ${
            viewMode === "suggest"
              ? "bg-primary text-white shadow-sm"
              : "border border-outline bg-surface text-foreground-secondary hover:bg-surface-alt"
          }`}
        >
          <Sparkles className="h-4 w-4" /> เมนูแนะนำ
        </button>
        {searchQuery.trim() && (
          <button
            onClick={() => setViewMode("search")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body font-medium transition-colors ${
              viewMode === "search"
                ? "bg-primary text-white shadow-sm"
                : "border border-outline bg-surface text-foreground-secondary hover:bg-surface-alt"
            }`}
          >
            <Search className="h-4 w-4" /> ผลค้นหา
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-body text-amber-800">{error}</p>
        </div>
      )}

      {/* ─── Recipe Grid ─── */}
      {isListLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-outline bg-surface shadow-card">
              <div className="h-40 bg-surface-alt animate-pulse" />
              <div className="p-4">
                <div className="h-4 w-3/4 rounded-full bg-surface-alt animate-pulse" />
                <div className="mt-3 h-3 w-1/2 rounded-full bg-surface-alt animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : displayRecipes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline bg-surface p-12 shadow-card">
          <ChefHat className="h-12 w-12 text-primary-light" />
          <p className="text-sm font-body font-medium text-foreground">
            {viewMode === "suggest" ? "ยังไม่มีเมนูแนะนำ" : "ไม่พบสูตรอาหารที่ค้นหา"}
          </p>
          <p className="text-xs font-body text-foreground-muted">
            {viewMode === "suggest" ? "เพิ่มวัตถุดิบในตู้เย็นของคุณเพื่อรับเมนูแนะนำ" : "ลองเปลี่ยนคำค้นหาใหม่"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              onClick={() => openDetail(recipe.id)}
              className="stagger-item group cursor-pointer overflow-hidden rounded-2xl border border-outline bg-surface shadow-card transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Recipe Image */}
              <div className="relative h-40 bg-gradient-to-br from-primary-pale to-secondary-light">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ChefHat className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                )}
                {"usedIngredientCount" in recipe && (
                  <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-body font-medium text-foreground-secondary backdrop-blur-sm">
                    {(recipe as RecipeSuggestion).usedIngredientCount} วัตถุดิบตรง
                  </div>
                )}
              </div>
              {/* Card Body */}
              <div className="p-4">
                <h4 className="text-sm font-heading font-semibold text-foreground group-hover:text-primary-dark transition-colors line-clamp-2">
                  {recipe.title}
                </h4>
                <div className="mt-2 flex items-center gap-4 text-xs font-body text-foreground-muted">
                  {"readyInMinutes" in recipe && (recipe as RecipeSearchResult).readyInMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {(recipe as RecipeSearchResult).readyInMinutes} นาที
                    </span>
                  )}
                  {"missedIngredientCount" in recipe && (
                    <span className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" /> ขาด {(recipe as RecipeSuggestion).missedIngredientCount} อย่าง
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
