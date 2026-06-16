"use client";

import { useState } from "react";
import { ChefHat, Heart, Trash2, ArrowRight } from "lucide-react";

interface SavedRecipe {
  id: number;
  title: string;
  image?: string;
  calories: number;
  readyInMinutes: number;
  servings: number;
}

const initialSavedRecipes: SavedRecipe[] = [
  { id: 104, title: "ไข่เจียวทรงเครื่อง", calories: 250, readyInMinutes: 10, servings: 2 },
  { id: 101, title: "ข้าวผัดอกไก่", calories: 450, readyInMinutes: 15, servings: 1 },
  { id: 102, title: "แกงจืดเต้าหู้หมูสับ", calories: 180, readyInMinutes: 20, servings: 3 }
];

export default function SavedRecipesView() {
  const [savedList, setSavedList] = useState<SavedRecipe[]>(initialSavedRecipes);

  const handleUnsave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedList(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">เมนูที่บันทึก (Saved Recipes)</h2>
        <p className="mt-1 text-xs font-body text-foreground-secondary">
          เข้าถึงเมนูโปรดของคุณได้อย่างรวดเร็ว เพื่อการวางแผนมื้ออาหารที่สะดวกขึ้น
        </p>
      </div>

      {savedList.length === 0 ? (
        <div className="rounded-xl border border-outline bg-surface p-12 text-center shadow-card">
          <Heart className="h-10 w-10 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm font-body text-foreground-muted">ยังไม่มีสูตรอาหารที่บันทึกไว้</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedList.map(recipe => (
            <div
              key={recipe.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-outline bg-surface p-5 shadow-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <Heart className="h-5 w-5 fill-red-500" />
                  </div>
                  <button
                    onClick={(e) => handleUnsave(recipe.id, e)}
                    className="text-foreground-muted hover:text-danger p-1 transition-colors"
                    title="ลบออกจากรายการโปรด"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h4 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors text-base truncate mb-1">
                  {recipe.title}
                </h4>
                <p className="text-[11px] font-body text-foreground-secondary">
                  {recipe.calories} kcal • {recipe.readyInMinutes} นาที • ทานได้ {recipe.servings} คน
                </p>
              </div>

              <div className="mt-5 border-t border-outline/50 pt-3 flex items-center justify-between">
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
