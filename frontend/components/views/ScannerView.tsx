"use client";

import { useState, useRef, useEffect } from "react";
import { inventoryAPI, aiAPI, type InventoryItem } from "@/lib/api";
import { Camera, UploadCloud, Sparkles, Clock } from "lucide-react";

export default function ScannerView() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── AI Scan State ───
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recentScannedNames, setRecentScannedNames] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ingredients_found: string[];
    added: string[];
    failed: string[];
  } | null>(null);

  const scanningTexts = [
    "กำลังวิเคราะห์พิกเซลภาพ...",
    "กำลังประมวลผลรูปทรงและสี...",
    "ค้นหาวัตถุดิบในฐานข้อมูล...",
    "เตรียมนำเข้าตู้เย็นอัตโนมัติ..."
  ];
  const [scanTextIndex, setScanTextIndex] = useState(0);

  useEffect(() => {
    const scanningTextsLength = 4; // Hardcoded to avoid dependency issues since array is static
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanTextIndex((prev) => (prev + 1) % scanningTextsLength);
      }, 2500);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScanTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

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

  const loadInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const data = await inventoryAPI.getAll();
      setInventoryItems(data);
    } catch (err) {
      console.error("Failed to load inventory for scanner view:", err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // ─── Load inventory items ───
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory();
  }, []);

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

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

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
          setRecentScannedNames(res.added);
          loadInventory();
        } else {
          setSubmitMessage("สแกนภาพสำเร็จ แต่ไม่พบวัตถุดิบ 🔍");
        }
      } catch (err: unknown) {
        console.error("AI Scan failed:", err);
        setSubmitMessage(`เกิดข้อผิดพลาดในการสแกน: ${(err as Error).message || "กรุณาลองใหม่"} ❌`);
      } finally {
        setIsScanning(false);
        setPreviewUrl(null);
        URL.revokeObjectURL(url);
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

  const getExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(dateStr);
    expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `หมดอายุแล้ว ${Math.abs(diffDays)} วัน`, color: "text-red-700 bg-red-100 border-red-200" };
    if (diffDays === 0) return { text: "หมดอายุวันนี้!", color: "text-red-700 bg-red-100 border-red-200" };
    if (diffDays <= 3) return { text: `เหลือ ${diffDays} วัน`, color: "text-orange-700 bg-orange-100 border-orange-200" };
    return { text: `เหลือ ${diffDays} วัน`, color: "text-slate-600 bg-slate-100 border-slate-200" };
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

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
        className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-3xl border-[3px] border-dashed p-8 transition-all duration-300 group overflow-hidden ${isScanning
            ? "border-primary-light bg-primary-pale/30 cursor-wait"
            : isDragging
              ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_40px_rgba(37,99,235,0.15)]"
              : "border-outline hover:border-primary/50 hover:bg-surface-alt scanner-zone-glow"
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
          <div className="flex flex-col items-center justify-center gap-4 z-10 w-full">
            <div className="relative w-32 h-32 bg-slate-100 rounded-3xl overflow-hidden border-[3px] border-white shadow-xl flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Scanning preview" className="w-full h-full object-cover brightness-75 contrast-110" />
              ) : (
                <Camera className="w-12 h-12 text-primary/30" />
              )}
              <div className="absolute left-0 right-0 h-[4px] bg-primary shadow-[0_0_20px_5px_rgba(92,124,250,0.8)] animate-scan-laser" />
            </div>
            <div className="text-center h-16">
              <p className="text-lg font-heading font-extrabold text-primary flex items-center justify-center gap-2 drop-shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse text-amber-400" />
                SmartFood AI
              </p>
              <p className="text-sm font-body font-bold text-slate-500 mt-1.5 transition-opacity duration-300" key={scanTextIndex}>
                {scanningTexts[scanTextIndex]}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Upload Icon */}
            <div className={`mb-5 rounded-3xl p-5 transition-all duration-300 ${isDragging ? "bg-primary text-white shadow-glow-blue scale-110 rotate-3" : "bg-white border border-slate-100 text-slate-400 shadow-sm group-hover:scale-105 group-hover:text-primary group-hover:border-primary/20"}`}>
              <UploadCloud className="w-10 h-10" />
            </div>

            <p className={`text-xl font-heading font-extrabold transition-colors ${isDragging ? "text-primary drop-shadow-sm" : "text-slate-800"}`}>
              {isDragging ? "ปล่อยรูปเลย! AI รอวิเคราะห์อยู่ ✨" : "ลากวางรูปภาพวัตถุดิบที่นี่"}
            </p>
            <p className="mt-2 text-sm font-body font-medium text-slate-500">หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</p>
            <p className="mt-3 text-xs font-body font-medium text-slate-500 bg-slate-100/80 border border-slate-200 px-3 py-1 rounded-full">รองรับ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
            <p className="mt-2 text-xs font-body text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">✨ วิเคราะห์ด้วยระบบ AI Vision ค้นหาวัตถุดิบและนำเข้าตู้เย็นทันที</p>
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
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showManualForm ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue mt-2 mb-2">
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
        </div>
      </div>

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
            {inventoryItems.map((item) => {
              const isRecent = recentScannedNames.includes(item.name);
              return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border-2 border-white p-4 shadow-soft-blue transition-airy hover-lift ${isRecent ? "bg-emerald-50/50 animate-[pulse_3s_ease-in-out_infinite]" : "bg-surface"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${isRecent ? "bg-emerald-100 shadow-inner" : "bg-primary-pale"}`}>
                    {categoryEmoji[item.category || "other"] || "📦"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-heading font-semibold text-foreground">{item.name}</p>
                      {isRecent && <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-bounce">NEW ✨</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-body text-foreground-muted">
                        {item.quantity} {item.unit}
                      </p>
                      {item.expiry_date && (
                        <>
                          <span className="text-foreground-muted text-xs">·</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shadow-sm ${getExpiryStatus(item.expiry_date).color}`}>
                            <Clock className="w-3 h-3" />
                            {getExpiryStatus(item.expiry_date).text}
                          </span>
                        </>
                      )}
                    </div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}