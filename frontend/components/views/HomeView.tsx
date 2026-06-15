"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Clock, Leaf } from "lucide-react";
import { inventoryAPI, type InventoryItem } from "@/lib/api";

export default function HomeView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await inventoryAPI.getAll();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
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
        <div className="flex items-center gap-2 rounded-xl bg-accent-yellow-light px-3 py-1.5 border border-white shadow-sm">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-body font-medium text-orange-700">
            {expiringSoon.length} ใกล้หมดอายุ
          </span>
        </div>
      </div>

      {/* ─── Expiring Soon Section ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-5 w-5 text-danger" />
          <h3 className="text-sm font-heading font-semibold text-foreground">ควรทานก่อน (1-4 วัน หรือหมดอายุแล้ว)</h3>
        </div>
        
        {expiringSoon.length === 0 ? (
          <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue text-center">
            <p className="text-sm font-body text-foreground-muted">ไม่มีอาหารใกล้หมดอายุ 🥳</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expiringSoon.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover:translate-y-[-2px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-red-light text-2xl border border-white">
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
          <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue text-center">
            <p className="text-sm font-body text-foreground-muted">ยังไม่มีอาหารสดใหม่</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {freshItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover:translate-y-[-2px] hover:shadow-md cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-pale text-2xl border border-white">
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
