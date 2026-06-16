"use client";

import { useState, useRef } from "react";
import { inventoryAPI, aiAPI } from "@/lib/api";
import { Camera, UploadCloud, CheckCircle, XCircle, Package, X, Trash2, Plus, Minus } from "lucide-react";

interface EditableIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string;
}

const CATEGORY_MAP: Record<string, string> = {
  protein: "โปรตีน 🥩",
  veggie: "ผัก 🥦",
  fruit: "ผลไม้ 🍎",
  dairy: "นม/เนย 🧀",
  seasoning: "เครื่องปรุง 🧴",
  carbs: "คาร์โบไฮเดรต 🍞",
  other: "อื่นๆ 📦"
};

const DEFAULT_UNITS = ["ชิ้น", "ฟอง", "กรัม", "กิโลกรัม", "แพ็ค", "กล่อง", "มิลลิลิตร", "ลิตร"];

export default function ScannerView() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── AI Scan State ───
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ingredients_found: string[];
    added: string[];
    failed: string[];
    detections?: Array<{ name: string; quantity: number; unit: string; box_2d: number[] }>;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedItems, setDetectedItems] = useState<EditableIngredient[] | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

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
    setDetectedItems(null);

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewUrl(reader.result as string);
      try {
        const base64String = (reader.result as string).split(",")[1];
        // 🔮 เรียก API เพื่อทำการ Scan อย่างเดียวโดยยังไม่บันทึกเข้า DB
        const res = await aiAPI.scanOnly(base64String, file.type);
        
        if (res.ingredients && res.ingredients.length > 0) {
          // Set scanResult to store detections for overlay rendering
          setScanResult({
            success: true,
            message: "วิเคราะห์สำเร็จ",
            ingredients_found: res.ingredients.map((item: any) => typeof item === "object" && item ? item.name : String(item)),
            added: [],
            failed: [],
            detections: res.ingredients.filter((item: any) => typeof item === "object" && item && item.box_2d) as any
          });

          const mappedItems: EditableIngredient[] = res.ingredients.map((item: any, index) => {
            const name = typeof item === "object" && item ? item.name : String(item);
            const quantity = typeof item === "object" && item ? (item.quantity ?? 1.0) : 1.0;
            const unit = typeof item === "object" && item ? (item.unit ?? "ชิ้น") : "ชิ้น";
            const category = typeof item === "object" && item ? (item.category ?? "other") : "other";

            let mappedCategory = "other";
            if (category && typeof category === "string") {
              const lowerCat = category.toLowerCase();
              if (lowerCat in CATEGORY_MAP) {
                mappedCategory = lowerCat;
              } else if (lowerCat === "grain" || lowerCat === "carbs" || lowerCat === "carbohydrate") {
                mappedCategory = "carbs";
              } else if (lowerCat === "condiment" || lowerCat === "seasoning") {
                mappedCategory = "seasoning";
              }
            }

            return {
              id: `${Date.now()}-${index}`,
              name,
              quantity,
              unit,
              category: mappedCategory,
              expiry_date: ""
            };
          });
          setDetectedItems(mappedItems);
          setSubmitMessage(`วิเคราะห์ภาพสำเร็จ! พบวัตถุดิบ ${res.ingredients.length} ชนิด โปรดตรวจสอบและแก้ไขข้อมูลด้านล่างก่อนกดบันทึกเข้าตู้เย็น ✅`);
        } else {
          setSubmitMessage("วิเคราะห์ภาพเสร็จสิ้น แต่ตรวจไม่พบอาหารหรือวัตถุดิบ 🔍");
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

  // ─── Edit Handlers ───
  const updateItemField = (id: string, field: keyof EditableIngredient, value: any) => {
    if (!detectedItems) return;
    setDetectedItems(prev =>
      prev ? prev.map(item => (item.id === id ? { ...item, [field]: value } : item)) : null
    );
  };

  const changeQuantity = (id: string, delta: number) => {
    if (!detectedItems) return;
    setDetectedItems(prev =>
      prev
        ? prev.map(item => {
            if (item.id === id) {
              const newQty = Math.max(0.1, parseFloat((item.quantity + delta).toFixed(2)));
              return { ...item, quantity: newQty };
            }
            return item;
          })
        : null
    );
  };

  const deleteItem = (id: string) => {
    if (!detectedItems) return;
    setDetectedItems(prev => (prev ? prev.filter(item => item.id !== id) : null));
  };

  const addNewItem = () => {
    const newItem: EditableIngredient = {
      id: `manual-${Date.now()}`,
      name: "",
      quantity: 1.0,
      unit: "ชิ้น",
      category: "other",
      expiry_date: ""
    };
    setDetectedItems(prev => (prev ? [...prev, newItem] : [newItem]));
  };

  // ─── Submit Handler ───
  const saveToFridge = async () => {
    if (!detectedItems || detectedItems.length === 0) return;
    
    // ตรวจสอบความถูกต้องของชื่อ
    const hasEmptyName = detectedItems.some(item => !item.name.trim());
    if (hasEmptyName) {
      setSubmitMessage("กรุณากรอกชื่อวัตถุดิบในช่องว่างให้ครบถ้วน ❌");
      return;
    }

    setIsSaving(true);
    setSubmitMessage("");
    try {
      const payload = detectedItems.map(item => ({
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit.trim(),
        category: item.category,
        expiry_date: item.expiry_date || undefined,
        added_by: "scan"
      }));

      // บันทึกผ่าน Backend API /inventory/bulk ซึ่งมีระบบตรวจตารางซ้ำซ้อนแล้ว
      const res = await inventoryAPI.addBulk(payload);
      setSubmitMessage(`สแกนสำเร็จ! เพิ่มวัตถุดิบเข้าตู้เย็นสำเร็จแล้วทั้งหมด ${res.length} รายการ! 🎉 ✅`);
      setDetectedItems(null); // เคลียร์รายการบอร์ด
    } catch (err: unknown) {
      console.error("Save to fridge failed:", err);
      setSubmitMessage(`บันทึกลงฐานข้อมูลล้มเหลว: ${(err as Error).message || "เกิดข้อผิดพลาด"} ❌`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <Camera className="h-8 w-8 text-primary animate-pulse" />
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">AI สแกนและตรวจวัตถุดิบ</h2>
          <p className="mt-1 text-sm font-body text-foreground-secondary">
            วิเคราะห์ประเภทและระบุอาหารด้วย AI โดยผู้ใช้สามารถปรับแต่งแก้ไขปริมาณ/หน่วยวัดได้ก่อนบันทึก
          </p>
        </div>
      </div>

      {/* Submit Notification */}
      {submitMessage && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 animate-scale-in ${
          submitMessage.includes("❌")
            ? "border-red-200/50 bg-red-50 text-red-800"
            : "border-emerald-200/50 bg-emerald-50 text-emerald-800"
        }`}>
          <p className="text-sm font-body font-medium">
            {submitMessage}
          </p>
        </div>
      )}

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isScanning && !isSaving && fileInputRef.current?.click()}
          className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 transition-all duration-200 ${
            isScanning || isSaving
              ? "border-primary-light bg-surface-alt cursor-wait animate-pulse"
              : isDragging
              ? "border-primary bg-primary-pale/50 shadow-md scale-[1.01]"
              : "border-outline hover:border-primary hover:bg-surface-alt"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic"
            className="hidden"
            onChange={handleFileChange}
            disabled={isScanning || isSaving}
          />
          {/* Upload Icon */}
          <div className={`mb-4 rounded-2xl p-4 transition-all duration-300 ${isDragging ? "bg-primary-pale" : "bg-surface-alt"}`}>
            <UploadCloud className={`h-12 w-12 transition-colors duration-300 ${isDragging ? "text-primary-dark" : "text-foreground-muted"}`} />
          </div>

          <p className="text-base font-heading font-semibold text-foreground">
            {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางภาพถ่ายของกิน หรือแตะเพื่อเลือกภาพ"}
          </p>
          <p className="mt-1 text-sm font-body text-foreground-secondary">หรือกดเลือกไฟล์รูปภาพที่นี่</p>
          <p className="mt-2 text-xs font-body text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes laserScan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            .animate-laser {
              position: absolute;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, transparent, #06b6d4, transparent);
              box-shadow: 0 0 10px #06b6d4;
              animation: laserScan 2.5s linear infinite;
            }
          `}} />

          {/* ─── Preview & Detections Overlay ─── */}
          <div
            onClick={() => !isScanning && setIsZoomed(true)}
            className="relative mx-auto w-full max-w-2xl lg:max-w-4xl rounded-2xl border border-outline bg-surface shadow-card p-0 overflow-visible transition-all duration-200 cursor-zoom-in"
          >
            <img
              src={previewUrl}
              alt="Scanned item preview"
              className="w-full h-auto block rounded-xl"
            />
            
            {/* Laser scanning line overlay while scanning */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/40 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                <div className="animate-laser" />
                <svg className="h-10 w-10 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-heading font-semibold text-white drop-shadow-md">กำลังวิเคราะห์ด้วย AI...</p>
              </div>
            )}

            {/* Bounding boxes overlay */}
            {!isScanning && scanResult?.detections?.map((det, idx) => {
              const [ymin, xmin, ymax, xmax] = det.box_2d;
              const top = `${ymin}%`;
              const left = `${xmin}%`;
              const height = `${ymax - ymin}%`;
              const width = `${xmax - xmin}%`;
              const isNearTop = ymin < 8;
              
              return (
                <div
                  key={idx}
                  style={{ top, left, width, height }}
                  className="absolute border-2 border-emerald-500 bg-transparent rounded-lg group hover:border-emerald-600 hover:bg-transparent transition-all duration-200 pointer-events-none"
                >
                  <span className={
                    isNearTop
                      ? "absolute top-1.5 left-1.5 rounded-md bg-emerald-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-white shadow-md whitespace-nowrap transition-all duration-200"
                      : "absolute -top-6 left-0 rounded-md bg-emerald-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-white shadow-md whitespace-nowrap transition-all duration-200"
                  }>
                    {det.name} ({det.quantity} {det.unit})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Editable Items Area */}
          {!isScanning && detectedItems && detectedItems.length > 0 && (
            <div className="rounded-2xl border border-outline bg-surface p-6 shadow-card animate-scale-in flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> ตรวจพบวัตถุดิบ {detectedItems.length} รายการ
                </h3>
                <p className="text-xs text-foreground-secondary">
                  * คุณสามารถตรวจสอบและปรับค่าต่างๆ ก่อนบันทึกเข้าตู้เย็นได้
                </p>
              </div>

              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                {detectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 bg-surface-alt border border-white/5 p-3.5 rounded-xl transition-all duration-200 hover:border-primary-light/30"
                  >
                    {/* Index & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-foreground-muted bg-white/5 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemField(item.id, "name", e.target.value)}
                        placeholder="ระบุชื่อวัตถุดิบ..."
                        className="flex-1 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none placeholder:text-foreground-muted"
                      />
                    </div>

                    {/* Controls (Qty, Unit, Category) */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-1 bg-surface border border-white/10 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="p-1 text-foreground-secondary hover:text-foreground rounded hover:bg-white/5"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          min="0.1"
                          step="any"
                          onChange={(e) => updateItemField(item.id, "quantity", parseFloat(e.target.value) || 1)}
                          className="w-12 text-center bg-transparent text-sm text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          className="p-1 text-foreground-secondary hover:text-foreground rounded hover:bg-white/5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Unit Select */}
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(item.id, "unit", e.target.value)}
                        className="rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {DEFAULT_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      {/* Category Select */}
                      <select
                        value={item.category}
                        onChange={(e) => updateItemField(item.id, "category", e.target.value)}
                        className="rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-foreground-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Row */}
              <div className="flex flex-col md:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={addNewItem}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-white/10 hover:border-primary px-4 py-3 text-sm text-foreground-secondary hover:text-primary transition-all duration-300 w-full justify-center"
                >
                  <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบในรายการใหม่
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveToFridge}
                  className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed px-6 py-2.5 font-heading font-semibold text-white shadow-sm transition-colors w-full justify-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังบันทึกข้อมูล...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> ยืนยันและบันทึกเข้าตู้เย็น
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!isScanning && (
            <button
              onClick={() => { setPreviewUrl(null); setScanResult(null); setDetectedItems(null); }}
              className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-heading font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark max-w-xs"
            >
              สแกนรูปภาพใหม่
            </button>
          )}
        </div>
      )}

      {/* ─── Lightbox Zoom Modal ─── */}
      {isZoomed && previewUrl && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl w-full rounded-2xl bg-surface p-1 shadow-2xl overflow-visible border border-outline/20"
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 text-white hover:text-primary-light transition-colors text-sm font-heading font-semibold flex items-center gap-1"
            >
              <X className="h-4 w-4" /> ปิดหน้าต่างขยาย
            </button>
            <img
              src={previewUrl}
              alt="Zoomed scan preview"
              className="w-full h-auto block rounded-xl max-h-[85vh] object-contain"
            />
            {/* Bounding boxes overlay on zoomed image */}
            {scanResult?.detections?.map((det, idx) => {
              const [ymin, xmin, ymax, xmax] = det.box_2d;
              const top = `${ymin}%`;
              const left = `${xmin}%`;
              const height = `${ymax - ymin}%`;
              const width = `${xmax - xmin}%`;
              const isNearTop = ymin < 8;
              
              return (
                <div
                  key={idx}
                  style={{ top, left, width, height }}
                  className="absolute border-2 border-emerald-500 bg-transparent rounded-lg pointer-events-none"
                >
                  <span className={
                    isNearTop
                      ? "absolute top-1.5 left-1.5 rounded-md bg-emerald-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-white shadow-md whitespace-nowrap"
                      : "absolute -top-6 left-0 rounded-md bg-emerald-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-white shadow-md whitespace-nowrap"
                  }>
                    {det.name} ({det.quantity} {det.unit})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
