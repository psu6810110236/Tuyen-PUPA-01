"use client";

import { useState, useEffect } from "react";
import { inventoryAPI, type InventoryItem } from "@/lib/api";
import { Plus, Edit2, CheckCircle, X, Minus, Trash2, Package, Search, ShoppingBag, ShoppingCart, Circle, CheckCircle2 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"fridge" | "grocery">("fridge");
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // ─── Grocery List State ───
  const [groceryList, setGroceryList] = useState<{
    id: string;
    name: string;
    quantity: string;
    checked: boolean;
    category: string;
  }[]>([
    { id: "1", name: "อกไก่", quantity: "1.5 กก.", checked: false, category: "Meat" },
    { id: "2", name: "นมสดจืด", quantity: "2 ขวด", checked: true, category: "Dairy" },
    { id: "3", name: "ไข่ไก่", quantity: "1 แผง", checked: false, category: "Dairy" },
    { id: "4", name: "ผักกาดหอม", quantity: "2 ต้น", checked: false, category: "Produce" },
    { id: "5", name: "มะเขือเทศ", quantity: "5 ลูก", checked: false, category: "Produce" },
  ]);
  const [newGroceryName, setNewGroceryName] = useState("");
  const [newGroceryQty, setNewGroceryQty] = useState("");
  const [newGroceryCategory, setNewGroceryCategory] = useState("Produce");

  const handleGroceryToggle = (id: string) => {
    setGroceryList(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleGroceryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name: newGroceryName.trim(),
      quantity: newGroceryQty.trim() || "1 หน่วย",
      checked: false,
      category: newGroceryCategory,
    };

    setGroceryList(prev => [newItem, ...prev]);
    setNewGroceryName("");
    setNewGroceryQty("");
  };

  const handleGroceryDelete = (id: string) => {
    setGroceryList(prev => prev.filter(item => item.id !== id));
  };

  const activeGroceryItems = groceryList.filter(item => !item.checked);
  const completedGroceryItems = groceryList.filter(item => item.checked);

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

  // ─── Handle update quantity ───
  const handleUpdateQuantity = async (item: InventoryItem, newQuantity: number) => {
    if (newQuantity < 0) return;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
    try {
      await inventoryAPI.update(item.id, { quantity: newQuantity });
    } catch (err) {
      console.error(err);
      fetchInventory();
    }
  };

  // ─── Handle delete ───
  const handleDelete = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการลบวัตถุดิบ",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}" ออกจากตู้เย็น?`,
      onConfirm: async () => {
        setItems(prev => prev.filter(i => i.id !== id));
        try {
          await inventoryAPI.delete(id);
        } catch (err) {
          console.error(err);
          fetchInventory();
        }
      }
    });
  };

  // ─── Handle delete all ───
  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: "ล้างข้อมูลตู้เย็นทั้งหมด",
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบวัตถุดิบทั้งหมดในตู้เย็น? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
      onConfirm: async () => {
        setItems([]);
        try {
          await inventoryAPI.deleteAll();
          setSubmitMessage("ลบวัตถุดิบทั้งหมดออกจากตู้เย็นสำเร็จแล้ว");
          setTimeout(() => setSubmitMessage(""), 3000);
        } catch (err) {
          console.error(err);
          fetchInventory();
          setSubmitMessage("เกิดข้อผิดพลาดในการลบวัตถุดิบ");
          setTimeout(() => setSubmitMessage(""), 3000);
        }
      }
    });
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
          <h2 className="text-2xl font-heading font-bold text-foreground">คลังอาหารและช้อปปิ้ง</h2>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            จัดการวัตถุดิบในตู้เย็นของคุณและรายการซื้อสินค้าที่จำเป็น
          </p>
        </div>
      </div>

      {/* ─── Tab Switched Header ─── */}
      <div className="flex border-b border-outline">
        <button
          onClick={() => setActiveTab("fridge")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-heading font-semibold border-b-2 transition-airy ${
            activeTab === "fridge"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          คลังวัตถุดิบ (Fridge Inventory)
        </button>
        <button
          onClick={() => setActiveTab("grocery")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-heading font-semibold border-b-2 transition-airy ${
            activeTab === "grocery"
              ? "border-primary text-primary"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          รายการซื้อของ (Grocery List)
        </button>
      </div>

      {activeTab === "fridge" ? (
        <>
          {submitMessage && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 animate-scale-in ${
              submitMessage.includes("สำเร็จ") || submitMessage.includes("✅")
                ? "border-emerald-200/50 bg-emerald-50 text-emerald-800"
                : "border-red-200/50 bg-red-50 text-red-800"
            }`}>
              <p className="text-sm font-body font-medium">
                {submitMessage}
              </p>
            </div>
          )}

          {/* ─── Add/Delete All Buttons ─── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex-1 flex items-center justify-center gap-2.5 rounded-xl bg-primary py-3 text-sm font-heading font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {showManualForm ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {showManualForm ? "ยกเลิก" : "เพิ่มวัตถุดิบด้วยมือ"}
            </button>
            {items.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-red-200 hover:bg-red-50 py-3 text-sm font-heading font-semibold text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                ล้างตู้เย็นทั้งหมด
              </button>
            )}
          </div>

          {/* ─── Manual Add Form ─── */}
          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 rounded-xl border border-outline bg-surface p-6 shadow-card animate-fade-in">
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
                  className="rounded-xl border border-outline bg-surface-alt px-4 py-2.5 text-sm font-body text-foreground placeholder-foreground-muted transition-colors focus:border-primary focus:outline-none"
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
                    className="rounded-xl border border-outline bg-surface-alt px-4 py-2.5 text-sm font-body text-foreground placeholder-foreground-muted transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="inv-unit" className="text-sm font-body font-medium text-foreground">หน่วย</label>
                  <select
                    id="inv-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="rounded-xl border border-outline bg-surface-alt px-4 py-2.5 text-sm font-body text-foreground transition-colors focus:border-primary focus:outline-none"
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
                      className={`rounded-full px-3.5 py-1.5 text-xs font-body font-medium transition-colors ${
                        formCategory === cat.value
                          ? "bg-primary text-white shadow-sm"
                          : "border border-outline bg-surface-alt text-foreground-secondary hover:bg-surface"
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
                  className="rounded-xl border border-outline bg-surface-alt px-4 py-2.5 text-sm font-body text-foreground transition-colors focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formName.trim() || !formQuantity.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-heading font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary"
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
              className="w-full rounded-xl border border-outline bg-surface py-3 pl-12 pr-4 text-sm font-body text-foreground placeholder-foreground-muted transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm font-body">
              {error}
            </div>
          )}

          {/* ─── Inventory List ─── */}
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center rounded-xl border border-outline bg-surface p-4 shadow-card">
                  <div className="h-12 w-12 rounded-xl bg-surface-alt animate-pulse" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-24 rounded-full bg-surface-alt animate-pulse" />
                    <div className="h-3 w-16 rounded-full bg-surface-alt animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : processedItems.length === 0 ? (
            <div className="rounded-xl border border-outline bg-surface p-8 text-center shadow-card">
              <p className="text-sm font-body text-foreground-muted">ไม่พบรายการวัตถุดิบ</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {processedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="stagger-item flex items-center gap-3 rounded-xl border border-outline bg-surface p-4 shadow-card hover:translate-y-[-1px] hover:shadow-md transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-pale text-2xl">
                    {item.icon}
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-base font-heading font-semibold text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-body text-foreground-secondary truncate">{item.category || "อื่นๆ"}</span>
                  </div>
                  
                  {/* ── Quantity Controls ── */}
                  <div className="flex items-center gap-1.5 bg-surface-alt rounded-full p-1 border border-outline shadow-inner">
                    <button
                      onClick={(e) => { e.stopPropagation(); if(item.quantity > 0) handleUpdateQuantity(item, item.quantity - 1); }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-secondary transition-colors hover:bg-white hover:text-danger hover:shadow-sm"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex flex-col items-center justify-center min-w-[2.5rem]">
                      <span className="text-sm font-heading font-bold text-foreground leading-none">{item.quantity}</span>
                      <span className="text-[9px] font-body text-foreground-muted leading-none mt-0.5">{item.unit}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item, item.quantity + 1); }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-secondary transition-colors hover:bg-white hover:text-primary-dark hover:shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-1 shrink-0">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-body font-medium whitespace-nowrap ${
                      item.daysLeft < 0
                        ? "bg-red-100 text-red-600 border border-red-300 expiry-glow-red"
                        : item.daysLeft <= 2
                        ? "bg-orange-100 text-orange-700 border border-orange-300 expiry-glow-orange"
                        : item.daysLeft <= 4
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-primary-pale/50 text-primary-dark border border-primary-pale"
                    }`}>
                      {item.daysLeft < 0 ? "⚠️ หมดอายุแล้ว" : item.daysLeft === 0 ? "🔴 หมดวันนี้" : item.daysLeft === 999 ? "ไม่มีวันหมดอายุ" : `อีก ${item.daysLeft} วัน`}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                      className="text-foreground-muted hover:text-danger transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ─── Grocery List Section (Merged) ─── */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Form Panel */}
          <div className="md:col-span-1">
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <h3 className="text-sm font-heading font-semibold text-foreground mb-4">เพิ่มสินค้าที่ต้องซื้อ</h3>
              <form onSubmit={handleGroceryAdd} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-body font-medium text-foreground-secondary">ชื่อสินค้า</label>
                  <input
                    type="text"
                    placeholder="เช่น บรอกโคลี, เนื้อปลา"
                    value={newGroceryName}
                    onChange={e => setNewGroceryName(e.target.value)}
                    className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-xs font-body text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-body font-medium text-foreground-secondary">จำนวน / ปริมาณ</label>
                  <input
                    type="text"
                    placeholder="เช่น 500 กรัม, 2 ชิ้น"
                    value={newGroceryQty}
                    onChange={e => setNewGroceryQty(e.target.value)}
                    className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-xs font-body text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-body font-medium text-foreground-secondary">หมวดหมู่</label>
                  <select
                    value={newGroceryCategory}
                    onChange={e => setNewGroceryCategory(e.target.value)}
                    className="rounded-lg border border-outline bg-surface-alt px-3 py-2 text-xs font-body text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="Produce">ผักและผลไม้</option>
                    <option value="Meat">เนื้อสัตว์ / อาหารทะเล</option>
                    <option value="Dairy">นม / ไข่ / เนย</option>
                    <option value="Pantry">เครื่องปรุง / อาหารแห้ง</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-heading font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มรายการ
                </button>
              </form>
            </div>
          </div>

          {/* List Panel */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="rounded-xl border border-outline bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between mb-4 border-b border-outline pb-3">
                <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  รายการที่ต้องช้อป ({activeGroceryItems.length})
                </h3>
              </div>

              {activeGroceryItems.length === 0 ? (
                <p className="text-xs font-body text-foreground-muted text-center py-6">ไม่มีรายการของที่ต้องซื้อเพิ่มเติม ช้อปครบแล้ว! 🎉</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {activeGroceryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-outline bg-surface-alt p-3 transition-colors hover:border-outline-variant"
                    >
                      <button
                        onClick={() => handleGroceryToggle(item.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Circle className="h-4 w-4 shrink-0 text-foreground-muted transition-colors hover:text-primary" />
                        <div>
                          <p className="text-xs font-body font-medium text-foreground">{item.name}</p>
                          <p className="text-[10px] font-body text-foreground-secondary">{item.quantity} • {item.category}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleGroceryDelete(item.id)}
                        className="text-foreground-muted hover:text-danger p-1"
                        title="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {completedGroceryItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-heading font-semibold text-foreground-secondary mb-3">ซื้อแล้ว ({completedGroceryItems.length})</h4>
                  <div className="flex flex-col gap-1.5 opacity-60">
                    {completedGroceryItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-outline bg-surface-alt p-2.5"
                      >
                        <button
                          onClick={() => handleGroceryToggle(item.id)}
                          className="flex items-center gap-3 text-left"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          <div>
                            <p className="text-xs font-body font-medium text-foreground line-through">{item.name}</p>
                            <p className="text-[9px] font-body text-foreground-secondary line-through">{item.quantity}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleGroceryDelete(item.id)}
                          className="text-foreground-muted hover:text-danger p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ─── Empty Spacer for Bottom Nav FAB ─── */}
      <div className="h-16 lg:hidden" />

      {/* ─── Custom Confirmation Modal ─── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-outline p-6 shadow-2xl animate-scale-in flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-heading font-bold text-foreground">
                {confirmModal.title}
              </h3>
              <p className="text-sm font-body text-foreground-secondary leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-outline px-4 py-2 text-sm font-heading font-semibold text-foreground hover:bg-surface-alt transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-heading font-semibold text-white transition-colors hover:brightness-95"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
