import React, { useState } from "react";
import { Keyboard, PenLine, CheckCircle2 } from "lucide-react";
import CustomSelect from "../../ui/CustomSelect";

type ScannerManualFormProps = {
  showManualForm: boolean;
  setShowManualForm: (val: boolean) => void;
  unitOptions: string[];
  categoryOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  onManualSubmit: (item: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    expiry_date?: string;
  }) => Promise<void>;
};

export default function ScannerManualForm({
  showManualForm,
  setShowManualForm,
  unitOptions,
  categoryOptions,
  isSubmitting,
  onManualSubmit,
}: ScannerManualFormProps) {
  const [formName, setFormName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("ชิ้น");
  const [formCategory, setFormCategory] = useState("other");
  const [formExpiry, setFormExpiry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuantity.trim()) return;

    await onManualSubmit({
      name: formName.trim(),
      quantity: parseFloat(formQuantity),
      unit: formUnit,
      category: formCategory,
      expiry_date: formExpiry || undefined,
    });

    setFormName("");
    setFormQuantity("");
    setFormUnit("ชิ้น");
    setFormCategory("other");
    setFormExpiry("");
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-outline" />
        <span className="text-sm font-body font-medium text-foreground-muted">หรือ เพิ่มวัตถุดิบด้วยมือ</span>
        <div className="h-px flex-1 bg-outline" />
      </div>

      <button
        onClick={() => setShowManualForm(!showManualForm)}
        className={`flex w-full max-w-sm mx-auto items-center justify-center gap-2 rounded-full border-2 py-3.5 text-sm font-heading font-semibold transition-airy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
          showManualForm
            ? "border-outline bg-surface text-foreground-secondary hover:bg-surface-alt"
            : "border-primary-light bg-primary-pale/30 text-primary-dark hover:bg-primary-pale shadow-sm hover:shadow-md"
        }`}
      >
        {showManualForm ? (
          <>✕ ปิดฟอร์ม</>
        ) : (
          <>
            <Keyboard className="h-4 w-4" />
            พิมพ์เพิ่มวัตถุดิบเอง
          </>
        )}
      </button>

      {showManualForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-fade-in">
          <h3 className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground">
            <PenLine className="h-4 w-4 text-primary" />
            เพิ่มวัตถุดิบเข้าตู้เย็น
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-name" className="text-sm font-body font-medium text-foreground">ชื่อวัตถุดิบ *</label>
            <input
              id="inv-name"
              type="text"
              placeholder="เช่น ไข่ไก่, อกไก่, แครอท"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-qty" className="text-sm font-body font-medium text-foreground">จำนวน *</label>
              <input
                id="inv-qty"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="3"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                required
                className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-unit" className="text-sm font-body font-medium text-foreground">หน่วย</label>
              <CustomSelect
                value={formUnit}
                onChange={(val: string) => setFormUnit(val)}
                options={unitOptions.map((u) => ({ value: u, label: u }))}
                className="w-full h-11"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-body font-medium text-foreground">หมวดหมู่</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormCategory(cat.value)}
                  className={`rounded-full px-3.5 py-2 text-xs font-body font-medium transition-airy ${formCategory === cat.value
                      ? "bg-primary text-white shadow-soft-blue"
                      : "border-2 border-white bg-surface-alt text-foreground-secondary hover:bg-surface shadow-soft-blue"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-expiry" className="text-sm font-body font-medium text-foreground">วันหมดอายุ (ถ้ามี)</label>
            <input
              id="inv-expiry"
              type="date"
              value={formExpiry}
              onChange={(e) => setFormExpiry(e.target.value)}
              className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formName.trim() || !formQuantity.trim()}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังเพิ่ม...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                เพิ่มเข้าตู้เย็น
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}
