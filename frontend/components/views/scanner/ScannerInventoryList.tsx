import React from "react";
import { Package, Inbox } from "lucide-react";
import { type InventoryItem } from "@/lib/api";

type ScannerInventoryListProps = {
  inventoryItems: InventoryItem[];
  isLoadingInventory: boolean;
  categoryEmoji: Record<string, string>;
  handleDelete: (item: InventoryItem) => void;
};

export default function ScannerInventoryList({
  inventoryItems,
  isLoadingInventory,
  categoryEmoji,
  handleDelete,
}: ScannerInventoryListProps) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-heading font-semibold text-foreground">
        <Package className="h-4 w-4 text-primary" />
        ของในตู้เย็นของคุณ ({inventoryItems.length} รายการ)
      </h3>

      {isLoadingInventory ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-surface-alt animate-pulse" />
                <div>
                  <div className="h-4 w-24 rounded-full bg-surface-alt animate-pulse" />
                  <div className="mt-1 h-3 w-16 rounded-full bg-surface-alt animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline bg-surface-alt/50 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-pale/50 mb-1">
            <Inbox className="h-8 w-8 text-primary-light" />
          </div>
          <p className="text-sm font-heading font-medium text-foreground-secondary">ตู้เย็นยังว่าง</p>
          <p className="text-xs font-body text-foreground-muted">เพิ่มวัตถุดิบด้วยการสแกนหรือพิมพ์ด้านบน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover-lift"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-pale text-xl">
                  {categoryEmoji[item.category || "other"] || "📦"}
                </div>
                <div>
                  <p className="text-sm font-heading font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs font-body text-foreground-muted">
                    {item.quantity} {item.unit}
                    {item.expiry_date && ` · หมดอายุ ${new Date(item.expiry_date).toLocaleDateString("th-TH")}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-body font-medium ${item.added_by === "scan" ? "bg-accent-green text-success" : "bg-primary-pale text-primary-dark"}`}>
                  {item.added_by === "scan" ? "สแกน" : "พิมพ์เอง"}
                </span>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition-airy hover:bg-accent-red hover:text-danger"
                  title="ลบรายการ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
