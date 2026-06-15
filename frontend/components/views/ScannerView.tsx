"use client";

import { useState, useRef } from "react";
import { inventoryAPI, aiAPI } from "@/lib/api";
import { Camera, UploadCloud, CheckCircle, XCircle, Plus, Edit2, Package, X } from "lucide-react";

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

  const unitOptions = ["ชิ้น", "ฟอง", "กรัม", "กิโลกรัม", "ลิตร", "ขวด", "ถุง", "กล่อง", "หัว", "ลูก"];
  const categoryOptions = [
    { value: "protein", label: "โปรตีน" },
    { value: "veggie", label: "ผัก" },
    { value: "fruit", label: "ผลไม้" },
    { value: "dairy", label: "นมเนย" },
    { value: "grain", label: "ธัญพืช" },
    { value: "other", label: "อื่นๆ" },
  ];

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
      setSubmitMessage(`เพิ่ม "${newItem.name}" ลงตู้เย็นสำเร็จ! ✅`);
      // Reset form
      setFormName("");
      setFormQuantity("");
      setFormUnit("ชิ้น");
      setFormCategory("other");
      setFormExpiry("");
      setShowManualForm(false);
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (err) {
      console.error("Failed to add item:", err);
      setSubmitMessage("เพิ่มวัตถุดิบล้มเหลว กรุณาลองใหม่ ❌");
      setTimeout(() => setSubmitMessage(""), 3000);
    } finally {
      setIsSubmitting(false);
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
          setSubmitMessage(`สแกนสำเร็จ! พบ ${res.ingredients_found.length} รายการ และเพิ่มเข้าตู้เย็นแล้ว ✅`);
        } else {
          setSubmitMessage("สแกนภาพสำเร็จ แต่ไม่พบวัตถุดิบ 🔍");
        }
      } catch (err: unknown) {
        console.error("AI Scan failed:", err);
        setSubmitMessage(`เกิดข้อผิดพลาดในการสแกน: ${(err as Error).message || "กรุณาลองใหม่"} ❌`);
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <Camera className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">สแกนวัตถุดิบ</h2>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            ถ่ายรูปวัตถุดิบ AI จะวิเคราะห์ให้อัตโนมัติ
          </p>
        </div>
      </div>

      {/* Submit Notification */}
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

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
          isScanning
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
              <UploadCloud className={`h-12 w-12 transition-colors duration-300 ${isDragging ? "text-primary-dark" : "text-foreground-muted"}`} />
            </div>

            <p className="text-base font-heading font-semibold text-foreground">
              {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางหรือแตะเพื่อถ่ายรูป"}
            </p>
            <p className="mt-1 text-sm font-body text-foreground-secondary">หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="mt-2 text-xs font-body text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
            <p className="mt-1.5 text-xs font-body text-accent-green font-semibold">✨ วิเคราะห์ด้วยระบบ AI Vision ค้นหาวัตถุดิบและนำเข้าตู้เย็นทันที</p>
          </>
        )}
      </div>

      {scanResult && (
        <div className="rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue animate-scale-in">
          <p className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> ผลการสแกนด้วย AI:
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {scanResult.ingredients_found.length > 0 ? (
              <>
                <p className="text-xs font-body text-foreground-secondary flex items-center gap-1.5">
                  <Package className="h-3 w-3" /> ตรวจพบวัตถุดิบ: <span className="font-semibold text-primary">{scanResult.ingredients_found.join(", ")}</span>
                </p>
                {scanResult.added.length > 0 && (
                  <p className="text-xs font-body text-success flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3" /> เพิ่มเข้าตู้เย็นสำเร็จ: {scanResult.added.join(", ")}
                  </p>
                )}
                {scanResult.failed.length > 0 && (
                  <p className="text-xs font-body text-danger flex items-center gap-1.5">
                    <XCircle className="h-3 w-3" /> ข้ามหรือเพิ่มไม่สำเร็จ: {scanResult.failed.join(", ")}
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
        {showManualForm ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
        {showManualForm ? "ปิดฟอร์ม" : "พิมพ์เพิ่มวัตถุดิบเอง"}
      </button>

      {/* ─── Manual Add Form ─── */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-fade-in">
          <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบด้วยมือ
          </h3>

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
              <>
                <CheckCircle className="h-4 w-4" /> เพิ่มเข้าตู้เย็น
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
