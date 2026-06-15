"use client";

import { useState, useEffect } from "react";
import { inventoryAPI, type InventoryItem } from "@/lib/api";
import { Plus, Edit2, CheckCircle, X, Minus, Trash2, Package, Search } from "lucide-react";

// ─── Helpers for display ───
const getFoodEmoji = (name: string, category: string | null): string => {
  const n = name.toLowerCase();
  if (n.includes("นม") || n.includes("milk")) return "🥛";
  if (n.includes("ไข่") || n.includes("egg")) return "🥚";
  if (n.includes("ไก่") || n.includes("chicken")) return "🍗";
  if (n.includes("หมู") || n.includes("pork")) return "🥩";
  if (n.includes("เนื้อ") || n.includes("beef")) return "🥩";
  if (n.includes("ปลา") || n.includes("fish")) return "🐟";
  if (n.includes("แครอท") || n.includes("carrot")) return "🥕";
  if (n.includes("แอปเปิ้ล") || n.includes("apple")) return "🍎";
  if (n.includes("ผัก") || n.includes("vegetable") || n.includes("spinach") || n.includes("🥬")) return "🥬";
  if (n.includes("ส้ม") || n.includes("orange")) return "🍊";
  if (n.includes("กล้วย") || n.includes("banana")) return "🍌";
  if (n.includes("ชีส") || n.includes("cheese")) return "🧀";
  if (n.includes("ขนมปัง") || n.includes("bread")) return "🍞";
  
  const cat = (category || "").toLowerCase();
  if (cat.includes("dairy")) return "🥛";
  if (cat.includes("produce") || cat.includes("veg") || cat.includes("fruit")) return "🥬";
  if (cat.includes("meat") || cat.includes("poultry") || cat.includes("protein")) return "🥩";
  if (cat.includes("seafood")) return "🐟";
  if (cat.includes("grain")) return "🍞";
  
  return "🥫";
};

const getDaysLeft = (expiryDateStr: string | null): number => {
  if (!expiryDateStr) return 999;
  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Manual Add Form State ───
  const [showManualForm, setShowManualForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("ชิ้น");
  const [formCategory, setFormCategory] = useState("other");
  const [formExpiry, setFormExpiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const unitOptions = ["ชิ้น", "ฟอง", "กรัม", "กิโลกรัม", "ลิตร", "ขวด", "ถุง", "กล่อง", "หัว", "ลูก"];
  const categoryOptions = [
    { value: "protein", label: "โปรตีน" },
    { value: "veggie", label: "ผัก" },
    { value: "fruit", label: "ผลไม้" },
    { value: "dairy", label: "นมเนย" },
    { value: "grain", label: "ธัญพืช" },
    { value: "other", label: "อื่นๆ" },
  ];

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryAPI.getAll();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("ไม่สามารถเชื่อมต่อคลังอาหารในตู้เย็นได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ─── Handle quantity update ───
  const handleUpdateQuantity = async (item: InventoryItem, newQuantity: number) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
    try {
      await inventoryAPI.update(item.id, { quantity: newQuantity });
    } catch (err) {
      console.error(err);
      fetchInventory();
    }
  };

  // ─── Handle delete ───
  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณต้องการลบวัตถุดิบนี้ใช่หรือไม่?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await inventoryAPI.delete(id);
    } catch (err) {
      console.error(err);
      fetchInventory();
    }
  };

  // ─── Handle manual add ───
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuantity.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      await inventoryAPI.addManual({
        name: formName.trim(),
        quantity: parseFloat(formQuantity),
        unit: formUnit,
        category: formCategory,
        expiry_date: formExpiry || undefined,
      });
      setSubmitMessage(`เพิ่มลงตู้เย็นสำเร็จ! ✅`);
      setFormName("");
      setFormQuantity("");
      setFormUnit("ชิ้น");
      setFormCategory("other");
      setFormExpiry("");
      setShowManualForm(false);
      setTimeout(() => setSubmitMessage(""), 3000);
      fetchInventory(); // Reload list
    } catch (err) {
      console.error("Failed to add item:", err);
      setSubmitMessage("เพิ่มวัตถุดิบล้มเหลว กรุณาลองใหม่ ❌");
      setTimeout(() => setSubmitMessage(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Filter & Process Items ───
  const processedItems = items
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
    .map((item) => ({
      ...item,
      daysLeft: getDaysLeft(item.expiry_date),
      icon: getFoodEmoji(item.name, item.category),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft); // Sort by expiry ascending

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">การจัดการวัตถุดิบ</h2>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            เพิ่ม ลด หรือแก้ไขรายการวัตถุดิบในตู้เย็นของคุณ
          </p>
        </div>
      </div>

      {submitMessage && (
        <div className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-3 animate-scale-in ${
          submitMessage.includes("✅")
            ? "border-accent-green bg-accent-green"
            : "border-accent-red bg-accent-red"
        }`}>
          <p className={`text-sm font-body font-medium ${submitMessage.includes("✅") ? "text-success" : "text-danger"}`}>
            {submitMessage}
          </p>
        </div>
      )}

      {/* ─── Manual Add Toggle Button ─── */}
      <button
        onClick={() => setShowManualForm(!showManualForm)}
        className="flex items-center justify-center gap-3 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-dark py-4 text-base font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99]"
      >
        {showManualForm ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
        {showManualForm ? "ยกเลิก" : "เพิ่มวัตถุดิบด้วยมือ"}
      </button>

      {/* ─── Manual Add Form ─── */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-fade-in">
          <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" /> ฟอร์มเพิ่มวัตถุดิบ
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
              <select
                id="inv-unit"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="rounded-2xl border-2 border-white bg-surface-alt px-4 py-3 text-sm font-body text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
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
                  className={`rounded-full px-3.5 py-2 text-xs font-body font-medium transition-airy ${
                    formCategory === cat.value
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
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isSubmitting ? "กำลังเพิ่ม..." : "ยืนยันการเพิ่ม"}
          </button>
        </form>
      )}

      {/* ─── Search Bar ─── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          placeholder="ค้นหาวัตถุดิบในตู้เย็น..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border-2 border-white bg-surface py-3.5 pl-12 pr-4 text-sm font-body text-foreground placeholder-foreground-muted shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-pale"
        />
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-accent-red bg-accent-red p-4 text-danger text-sm font-body">
          {error}
        </div>
      )}

      {/* ─── Inventory List ─── */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-center rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue">
              <div className="h-12 w-12 rounded-2xl bg-surface-alt animate-pulse" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-24 rounded-full bg-surface-alt animate-pulse" />
                <div className="h-3 w-16 rounded-full bg-surface-alt animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : processedItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-white bg-surface p-8 text-center shadow-soft-blue">
          <p className="text-sm font-body text-foreground-muted">ไม่พบรายการวัตถุดิบ</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {processedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue transition-airy hover:translate-y-[-2px] hover:shadow-md cursor-pointer"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-pale text-2xl border border-white">
                {item.icon}
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-base font-heading font-semibold text-foreground truncate">
                  {item.name}
                </span>
                <span className="text-xs font-body text-foreground-secondary truncate">{item.category || "อื่นๆ"}</span>
              </div>
              
              {/* ── Quantity Controls ── */}
              <div className="flex items-center gap-1.5 bg-surface-alt rounded-full p-1 border border-outline/50 shadow-inner">
                <button
                  onClick={(e) => { e.stopPropagation(); if(item.quantity > 0) handleUpdateQuantity(item, item.quantity - 1); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-secondary transition-airy hover:bg-white hover:text-danger hover:shadow-sm"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-col items-center justify-center min-w-[2.5rem]">
                  <span className="text-sm font-heading font-bold text-foreground leading-none">{item.quantity}</span>
                  <span className="text-[9px] font-body text-foreground-muted leading-none mt-0.5">{item.unit}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item, item.quantity + 1); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-secondary transition-airy hover:bg-white hover:text-primary-dark hover:shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col items-end gap-2 ml-1 shrink-0">
                <span className={`rounded-full px-2 py-1 text-[10px] font-body font-medium whitespace-nowrap ${
                  item.daysLeft < 0 ? "bg-red-100 text-red-600 border border-red-200 animate-pulse" : 
                  item.daysLeft <= 4 ? "bg-accent-red text-danger" : 
                  "bg-primary-pale/50 text-primary-dark border border-primary-pale"
                }`}>
                  {item.daysLeft < 0 ? "หมดอายุแล้ว" : item.daysLeft === 0 ? "หมดวันนี้" : item.daysLeft === 999 ? "ไม่มีวันหมดอายุ" : `อีก ${item.daysLeft} วัน`}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="text-foreground-muted hover:text-danger transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* ─── Empty Spacer for Bottom Nav FAB ─── */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
