"use client";

import { useState, useRef, useEffect } from "react";
import { inventoryAPI, aiAPI, type InventoryItem } from "@/lib/api";

export default function ScannerView() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── AI Scan State ───
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ingredients_found: string[];
    added: string[];
    failed: string[];
  } | null>(null);

  // ─── Manual Add Form State ───
  const [showManualForm, setShowManualForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("ชิ้น");
  const [formCategory, setFormCategory] = useState("other");
  const [formExpiry, setFormExpiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // ─── Inventory List State ───
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  const unitOptions = ["ชิ้น", "ฟอง", "กรัม", "กิโลกรัม", "ลิตร", "ขวด", "ถุง", "กล่อง", "หัว", "ลูก"];
  const categoryOptions = [
    { value: "protein", label: "🥩 โปรตีน" },
    { value: "veggie", label: "🥦 ผัก" },
    { value: "fruit", label: "🍎 ผลไม้" },
    { value: "dairy", label: "🧀 นมเนย" },
    { value: "grain", label: "🌾 ธัญพืช" },
    { value: "other", label: "📦 อื่นๆ" },
  ];

  // ─── Load inventory items ───
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const items = await inventoryAPI.getAll();
      setInventoryItems(items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // ─── Handle manual add ───
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuantity.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const newItem = await inventoryAPI.addManual({
        name: formName.trim(),
        quantity: parseFloat(formQuantity),
        unit: formUnit,
        category: formCategory,
        expiry_date: formExpiry || undefined,
      });
      setInventoryItems((prev) => [newItem, ...prev]);
      setSubmitMessage(`เพิ่ม "${newItem.name}" ลงตู้เย็นสำเร็จ! ✅`);
      // Reset form
      setFormName("");
      setFormQuantity("");
      setFormUnit("ชิ้น");
      setFormCategory("other");
      setFormExpiry("");
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (err) {
      console.error("Failed to add item:", err);
      setSubmitMessage("เพิ่มวัตถุดิบล้มเหลว กรุณาลองใหม่ ❌");
      setTimeout(() => setSubmitMessage(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle delete ───
  const handleDelete = async (item: InventoryItem) => {
    try {
      await inventoryAPI.delete(item.id);
      setInventoryItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น ❌");
      setTimeout(() => setSubmitMessage(""), 4000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitMessage("ขนาดรูปภาพต้องไม่เกิน 10MB ❌");
      setTimeout(() => setSubmitMessage(""), 4000);
      return;
    }

    setIsScanning(true);
    setSubmitMessage("");
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const res = await aiAPI.scanAndAdd(base64String, file.type);
        setScanResult(res);
        if (res.success && res.ingredients_found.length > 0) {
          setSubmitMessage(`สแกนสำเร็จ! พบ ${res.ingredients_found.length} รายการ และเพิ่มเข้าตู้เย็นแล้ว 🎉`);
          loadInventory();
        } else {
          setSubmitMessage("สแกนภาพสำเร็จ แต่ไม่พบวัตถุดิบ 🔍");
        }
      } catch (err: any) {
        console.error("AI Scan failed:", err);
        setSubmitMessage(`เกิดข้อผิดพลาดในการสแกน: ${err.message || "กรุณาลองใหม่"} ❌`);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // ─── Category emoji mapping ───
  const categoryEmoji: Record<string, string> = {
    protein: "🥩",
    veggie: "🥦",
    fruit: "🍎",
    dairy: "🧀",
    grain: "🌾",
    other: "📦",
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">📸 สแกนวัตถุดิบเข้าตู้เย็น</h2>
        <p className="mt-1 text-sm font-body text-foreground-secondary">
          ถ่ายรูปหรืออัปโหลดรูปวัตถุดิบ AI จะวิเคราะห์และเพิ่มเข้าคลังเสบียงให้อัตโนมัติ
        </p>
      </div>

      {/* Submit Notification */}
      {submitMessage && (
        <div className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-3 animate-scale-in ${submitMessage.includes("✅")
            ? "border-accent-green bg-accent-green"
            : "border-accent-red bg-accent-red"
          }`}>
          <p className={`text-sm font-body font-medium ${submitMessage.includes("✅") ? "text-success" : "text-danger"}`}>
            {submitMessage}
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${isScanning
            ? "border-primary-light bg-surface-alt cursor-wait animate-pulse"
            : isDragging
              ? "border-primary bg-primary-pale/50 shadow-glow-teal scale-[1.01]"
              : "border-outline hover:border-primary-light hover:bg-surface-alt"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          className="hidden"
          onChange={handleFileChange}
          disabled={isScanning}
        />

        {isScanning ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <svg className="h-10 w-10 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-base font-heading font-semibold text-primary">SmartFood AI กำลังวิเคราะห์รูปภาพของคุณ...</p>
            <p className="text-xs font-body text-foreground-muted">ระบบจะแสกนวัตถุดิบและนำเข้าตู้เย็นโดยอัตโนมัติ</p>
          </div>
        ) : (
          <>
            {/* Upload Icon */}
            <div className={`mb-4 rounded-2xl p-4 transition-all duration-300 ${isDragging ? "bg-primary-pale" : "bg-surface-alt"}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-12 w-12 transition-colors duration-300 ${isDragging ? "text-primary-dark" : "text-foreground-muted"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>

            <p className="text-base font-heading font-semibold text-foreground">
              {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางรูปภาพวัตถุดิบที่นี่"}
            </p>
            <p className="mt-1 text-sm font-body text-foreground-secondary">หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="mt-2 text-xs font-body text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
            <p className="mt-1.5 text-xs font-body text-accent-green font-semibold">✨ วิเคราะห์ด้วยระบบ AI Vision ค้นหาวัตถุดิบและนำเข้าตู้เย็นทันที</p>
          </>
        )}
      </div>

      {scanResult && (
        <div className="rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue animate-scale-in">
          <p className="text-sm font-heading font-bold text-foreground">📊 ผลการสแกนด้วย AI:</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {scanResult.ingredients_found.length > 0 ? (
              <>
                <p className="text-xs font-body text-foreground-secondary">
                  🔍 ตรวจพบวัตถุดิบ: <span className="font-semibold text-primary">{scanResult.ingredients_found.join(", ")}</span>
                </p>
                {scanResult.added.length > 0 && (
                  <p className="text-xs font-body text-success">
                    ✅ เพิ่มเข้าตู้เย็นสำเร็จ: {scanResult.added.join(", ")}
                  </p>
                )}
                {scanResult.failed.length > 0 && (
                  <p className="text-xs font-body text-danger">
                    ❌ ข้ามหรือเพิ่มไม่สำเร็จ: {scanResult.failed.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs font-body text-foreground-muted">
                ไม่พบวัตถุดิบที่สามารถระบุได้ในรูปภาพนี้
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Or Divider ─── */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-outline" />
        <span className="text-sm font-body font-medium text-foreground-muted">หรือ เพิ่มวัตถุดิบด้วยมือ</span>
        <div className="h-px flex-1 bg-outline" />
      </div>

      {/* ─── Manual Add Toggle Button ─── */}
      <button
        onClick={() => setShowManualForm(!showManualForm)}
        className="flex items-center justify-center gap-3 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-dark py-4 text-base font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99]"
      >
        {showManualForm ? "✕ ปิดฟอร์ม" : "✏️ พิมพ์เพิ่มวัตถุดิบเอง"}
      </button>

      {/* ─── Manual Add Form ─── */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-fade-in">
          <h3 className="text-sm font-heading font-semibold text-foreground">📝 เพิ่มวัตถุดิบเข้าตู้เย็น</h3>

          {/* Name */}
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

          {/* Quantity + Unit */}
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

          {/* Category */}
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

          {/* Expiry Date */}
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

          {/* Submit */}
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
              "➕ เพิ่มเข้าตู้เย็น"
            )}
          </button>
        </form>
      )}

      {/* ─── Current Inventory ─── */}
      <div>
        <h3 className="mb-3 text-sm font-heading font-semibold text-foreground">
          🧊 ของในตู้เย็นของคุณ ({inventoryItems.length} รายการ)
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-white bg-surface p-8 shadow-soft-blue">
            <span className="text-4xl">🧊</span>
            <p className="text-sm font-body text-foreground-muted">ตู้เย็นยังว่าง</p>
            <p className="text-xs font-body text-foreground-muted">เพิ่มวัตถุดิบด้วยปุ่มด้านบน!</p>
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-body font-medium ${item.added_by === "scan" ? "bg-accent-green text-success" : "bg-primary-pale text-primary-dark"
                    }`}>
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
    </div>
  );
}