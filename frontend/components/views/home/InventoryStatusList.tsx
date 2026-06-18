import React from "react";
import { Clock, Leaf } from "lucide-react";
import { type InventoryItem } from "@/lib/api";

type ProcessedItem = InventoryItem & {
  daysLeft: number;
  icon: string;
};

type InventoryStatusListProps = {
  expiringSoon: ProcessedItem[];
  freshItems: ProcessedItem[];
};

export default function InventoryStatusList({
  expiringSoon,
  freshItems,
}: InventoryStatusListProps) {
  return (
    <>
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
    </>
  );
}
