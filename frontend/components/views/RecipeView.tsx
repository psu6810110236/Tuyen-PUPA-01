"use client";

import { useState } from "react";

const categories = [
  { id: "all", label: "ทั้งหมด" },
  { id: "thai", label: "🇹🇭 อาหารไทย" },
  { id: "salad", label: "🥗 สลัด" },
  { id: "soup", label: "🍲 ซุป" },
  { id: "clean", label: "🥦 อาหารคลีน" },
  { id: "dessert", label: "🍰 ของหวาน" },
];

const recipes = [
  {
    id: 1,
    name: "สลัดอกไก่ย่างซอสงา",
    time: "15 นาที",
    calories: 320,
    difficulty: "ง่าย",
    gradient: "from-primary-pale to-primary-light",
    emoji: "🥗",
  },
  {
    id: 2,
    name: "ต้มยำกุ้งน้ำใส",
    time: "25 นาที",
    calories: 280,
    difficulty: "ปานกลาง",
    gradient: "from-secondary-light to-secondary",
    emoji: "🍲",
  },
  {
    id: 3,
    name: "ข้าวกล้องผัดผัก",
    time: "20 นาที",
    calories: 380,
    difficulty: "ง่าย",
    gradient: "from-accent-yellow-light to-accent-yellow",
    emoji: "🍚",
  },
  {
    id: 4,
    name: "สมูทตี้เบอร์รี่โยเกิร์ต",
    time: "5 นาที",
    calories: 180,
    difficulty: "ง่ายมาก",
    gradient: "from-accent-blush to-pink-300",
    emoji: "🫐",
  },
  {
    id: 5,
    name: "แกงจืดเต้าหู้หมูสับ",
    time: "30 นาที",
    calories: 250,
    difficulty: "ปานกลาง",
    gradient: "from-primary-fixed to-primary",
    emoji: "🥘",
  },
  {
    id: 6,
    name: "โอ๊ตมีลกล้วยหอม",
    time: "10 นาที",
    calories: 290,
    difficulty: "ง่าย",
    gradient: "from-accent-lavender to-purple-300",
    emoji: "🥣",
  },
];

export default function RecipeView() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">🍳 สูตรอาหาร</h2>
        <p className="mt-1 text-sm font-body text-foreground-secondary">
          ค้นหาสูตรอาหารเพื่อสุขภาพที่เหมาะกับคุณ
        </p>
      </div>

      {/* ─── Search Bar (Pill-shaped — rounded-full) ─── */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="ค้นหาสูตรอาหาร..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border-2 border-white bg-surface py-3.5 pl-12 pr-4 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
        />
      </div>

      {/* ─── Category Chips (Pill-shaped — rounded-full) ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-body font-medium transition-airy ${
              activeCategory === cat.id
                ? "bg-primary text-white shadow-soft-blue"
                : "border-2 border-white bg-surface text-foreground-secondary hover:bg-surface-alt shadow-soft-blue"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Recipe Grid ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="group cursor-pointer overflow-hidden rounded-2xl border-2 border-white bg-surface shadow-soft-blue transition-airy hover-lift"
          >
            {/* Image Placeholder */}
            <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${recipe.gradient}`}>
              <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                {recipe.emoji}
              </span>
              <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-body font-medium text-foreground-secondary backdrop-blur-sm">
                {recipe.difficulty}
              </div>
            </div>
            {/* Card Body */}
            <div className="p-4">
              <h4 className="text-sm font-heading font-semibold text-foreground group-hover:text-primary-dark transition-colors">
                {recipe.name}
              </h4>
              <div className="mt-2 flex items-center gap-4 text-xs font-body text-foreground-muted">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.time}
                </span>
                <span className="flex items-center gap-1">
                  🔥 {recipe.calories} kcal
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
