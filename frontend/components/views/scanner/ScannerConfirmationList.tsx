import React from "react";
import { X, ClipboardCheck, Save } from "lucide-react";
import CustomSelect from "../../ui/CustomSelect";

type DetectedItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  box_2d: number[];
};

type ScannerConfirmationListProps = {
  detectedItems: DetectedItem[];
  isSubmitting: boolean;
  unitOptions: string[];
  categoryOptions: { value: string; label: string }[];
  updateDetectedItemField: (index: number, field: string, value: string | number) => void;
  deleteDetectedItem: (index: number) => void;
  handleConfirmStore: () => void;
};

export default function ScannerConfirmationList({
  detectedItems,
  isSubmitting,
  unitOptions,
  categoryOptions,
  updateDetectedItemField,
  deleteDetectedItem,
  handleConfirmStore,
}: ScannerConfirmationListProps) {
  if (detectedItems.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-scale-in flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-outline pb-3">
        <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          ยืนยันวัตถุดิบที่ตรวจพบ ({detectedItems.length} รายการ)
        </h3>
        <span className="text-xs text-foreground-muted font-body">คุณสามารถแก้ไขข้อมูลได้ก่อนบันทึกจริง</span>
      </div>

      <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-1">
        {detectedItems.map((item, idx) => (
          <div 
            key={idx}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/60 bg-gradient-to-br from-white/80 to-surface-alt/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:border-primary-light/50 group"
          >
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-heading font-bold h-6 w-6 rounded-full bg-primary-pale text-primary-dark flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              
              {/* Name Input */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateDetectedItemField(idx, "name", e.target.value)}
                className="flex-1 sm:w-44 rounded-xl border-2 border-transparent bg-white/80 px-3 py-1.5 text-sm font-heading font-bold text-slate-800 shadow-sm transition-all duration-300 focus:border-primary-light focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 group-hover:bg-white"
                placeholder="ชื่อวัตถุดิบ"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Quantity Input */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-body text-foreground-secondary">จำนวน</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={item.quantity}
                  onChange={(e) => updateDetectedItemField(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-16 rounded-xl border-2 border-transparent bg-white/80 px-2 py-1.5 text-center text-sm font-body font-semibold text-slate-800 shadow-sm transition-all duration-300 focus:border-primary-light focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 group-hover:bg-white"
                />
              </div>

              {/* Unit Select */}
              <CustomSelect
                value={item.unit}
                onChange={(val: string) => updateDetectedItemField(idx, "unit", val)}
                options={unitOptions.map((u) => ({ value: u, label: u }))}
                className="w-24"
              />

              {/* Category Select */}
              <CustomSelect
                value={item.category}
                onChange={(val: string) => updateDetectedItemField(idx, "category", val)}
                options={categoryOptions}
                className="w-32"
              />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => deleteDetectedItem(idx)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-foreground-muted border border-outline bg-surface hover:bg-accent-red hover:text-danger hover:border-accent-red/20 transition-all duration-200"
                title="ลบรายการนี้"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isSubmitting || detectedItems.length === 0}
        onClick={handleConfirmStore}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark py-3.5 text-base font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            กำลังบันทึกข้อมูล...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            ยืนยันข้อมูลทั้งหมด และบันทึกเข้าตู้เย็น
          </>
        )}
      </button>
    </div>
  );
}
