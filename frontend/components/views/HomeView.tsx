"use client";

import { useState } from "react";
import { AlertCircle, Clock, Leaf } from "lucide-react";

// ─── Mock Inventory Data ───
type InventoryItem = {
  id: string;
  name: string;
  daysLeft: number;
  icon: string;
  category: string;
};

const mockExpiringSoon: InventoryItem[] = [
  { id: "1", name: "นมสด", daysLeft: 2, icon: "🥛", category: "Dairy" },
  { id: "2", name: "ผักโขม", daysLeft: 3, icon: "🥬", category: "Produce" },
  { id: "3", name: "อกไก่", daysLeft: 4, icon: "🍗", category: "Meat" },
];

const mockFreshItems: InventoryItem[] = [
  { id: "4", name: "แครอท", daysLeft: 14, icon: "🥕", category: "Produce" },
  { id: "5", name: "ไข่ไก่", daysLeft: 21, icon: "🥚", category: "Dairy" },
  { id: "6", name: "แอปเปิ้ล", daysLeft: 10, icon: "🍎", category: "Produce" },
];

export default function HomeView() {
  const [isLoading] = useState(false); // Can be tied to a real fetch later

  // ─── Loading Skeleton ───
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <div className="h-4 w-48 rounded-full bg-surface-alt animate-pulse" />
          <div className="mt-2 h-7 w-36 rounded-full bg-surface-alt animate-pulse" />
        </div>
        <div className="grid gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-2xl bg-surface-alt animate-pulse" />
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
        <div className="flex items-center gap-2 rounded-xl bg-accent-yellow-light px-3 py-1.5 border border-white shadow-sm">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-body font-medium text-orange-700">
            {mockExpiringSoon.length} ใกล้หมดอายุ
          </span>
        </div>
      </div>

      {/* ─── Expiring Soon Section ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-5 w-5 text-danger" />
          <h3 className="text-sm font-heading font-semibold text-foreground">ควรทานก่อน (1-4 วัน)</h3>
        </div>
        
        {mockExpiringSoon.length === 0 ? (
          <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue text-center">
            <p className="text-sm font-body text-foreground-muted">ไม่มีอาหารใกล้หมดอายุ 🥳</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mockExpiringSoon.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover:translate-y-[-2px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-red-light text-2xl border border-white">
                  {item.icon}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-heading font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs font-body text-foreground-secondary">{item.category}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-full bg-accent-red px-2.5 py-1 text-xs font-body font-medium text-danger">
                    อีก {item.daysLeft} วัน
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

        {mockFreshItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue text-center">
            <p className="text-sm font-body text-foreground-muted">ยังไม่มีอาหารสดใหม่</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mockFreshItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover:translate-y-[-2px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-pale text-2xl border border-white">
                  {item.icon}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-heading font-semibold text-foreground">{item.name}</span>
                  <span className="text-xs font-body text-foreground-secondary">{item.category}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-body font-medium text-primary-dark">
                    {item.daysLeft} วัน
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* ─── Empty Spacer for Bottom Nav FAB ─── */}
      {/* Give breathing room so the last items are not obscured by the bottom navigation FAB */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
