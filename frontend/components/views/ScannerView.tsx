"use client";

import { useState, useRef, useEffect } from "react";
import { inventoryAPI, aiAPI, type InventoryItem } from "@/lib/api";
import { X } from "lucide-react";

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
  const [detectedItems, setDetectedItems] = useState<Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    box_2d: number[];
  }>>([]);
  const [rawDetections, setRawDetections] = useState<Array<{
    name: string;
    quantity: number;
    unit: string;
    box_2d: number[];
  }>>([]);
  const [isZoomed, setIsZoomed] = useState(false);

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
    { value: "protein", label: "🥩  โปรตีน" },
    { value: "veggie", label: "🥦  ผัก" },
    { value: "fruit", label: "🍎  ผลไม้" },
    { value: "dairy", label: "🧀  นมเนย" },
    { value: "grain", label: "🌾  ธัญพืช" },
    { value: "other", label: "📦  อื่นๆ" },
  ];

  const formatQuantity = (qty: number, unit: string): number => {
    const integerUnits = ["ฟอง", "ชิ้น", "ขวด", "ถุง", "กล่อง", "หัว", "ลูก"];
    if (integerUnits.includes(unit)) {
      return Math.round(qty);
    }
    return qty;
  };

  const activeNames = new Set(detectedItems.map((item) => item.name.trim().toLowerCase()));
  const visibleDetections = rawDetections
    .map((det) => {
      const matchedItem = detectedItems.find(
        (item) => item.name.trim().toLowerCase() === det.name.trim().toLowerCase()
      );
      return {
        ...det,
        name: matchedItem ? matchedItem.name : det.name,
        unit: matchedItem ? matchedItem.unit : det.unit,
        quantity: matchedItem ? matchedItem.quantity : det.quantity,
      };
    })
    .filter((det) => activeNames.has(det.name.trim().toLowerCase()));

  const normalizeBox = (box: number[]): number[] => {
    if (!box || box.length !== 4) return [0, 0, 100, 100];
    try {
      let coords = box.map(Number);
      const maxVal = Math.max(...coords);
      if (maxVal <= 1.0) {
        coords = coords.map((x) => x * 100);
      } else if (maxVal > 100.0) {
        coords = coords.map((x) => x / 10);
      }
      return coords.map((x) => Math.max(0, Math.min(100, x)));
    } catch (err) {
      return [0, 0, 100, 100];
    }
  };

  const updateDetectedItemField = (index: number, field: string, value: string | number) => {
    setDetectedItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updatedVal = field === "quantity" ? Number(value) || 0 : value;
          const updatedItem = { ...item, [field]: updatedVal };
          if (field === "quantity" || field === "unit") {
            updatedItem.quantity = formatQuantity(updatedItem.quantity, updatedItem.unit);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const deleteDetectedItem = (index: number) => {
    setDetectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmStore = async () => {
    if (detectedItems.length === 0) return;
    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const bulkItems = detectedItems.map((item) => ({
        name: item.name.trim(),
        quantity: formatQuantity(Number(item.quantity) || 1, item.unit),
        unit: item.unit,
        category: item.category,
        added_by: "scan",
      }));
      
      const addedItems = await inventoryAPI.addBulk(bulkItems);
      setSubmitMessage(`สแกนและนำเข้าตู้เย็นสำเร็จ ${addedItems.length} รายการ! ✅`);
      setDetectedItems([]);
      setRawDetections([]);
      setPreviewUrl(null);
      setScanResult(null);
      loadInventory();
      setTimeout(() => setSubmitMessage(""), 4000);
    } catch (err) {
      console.error("Failed to add bulk inventory:", err);
      setSubmitMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่ ❌");
      setTimeout(() => setSubmitMessage(""), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const compressImage = (file: File, maxW = 1024, maxH = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl.split(",")[1]);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น ❌");
      setTimeout(() => setSubmitMessage(""), 4000);
      return;
    }

    setIsScanning(true);
    setSubmitMessage("");
    setScanResult(null);
    setDetectedItems([]);
    setRawDetections([]);

    // 1. Show raw file preview immediately for premium UX (no waiting)
    const previewReader = new FileReader();
    previewReader.onload = () => {
      setPreviewUrl(previewReader.result as string);
    };
    previewReader.readAsDataURL(file);

    try {
      // 2. Compress and resize image in browser background (scales down large camera photos)
      const compressedBase64 = await compressImage(file, 1024, 1024);
      
      // 3. Scan items via API (only detects, does not automatically save to DB)
      const res = await aiAPI.scanOnly(compressedBase64, "image/jpeg");
      
      const items = (res.ingredients || []).map((ing: { name?: string; quantity?: number; unit?: string; category?: string; box_2d?: number[] } | string) => {
        if (typeof ing === "string") {
          return { name: ing, quantity: 1, unit: "ชิ้น", category: "other", box_2d: [0, 0, 100, 100] };
        }
        return {
          name: ing.name || "",
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || "ชิ้น",
          category: ing.category || "other",
          box_2d: normalizeBox(ing.box_2d || [0, 0, 100, 100])
        };
      }).filter((item) => item.name !== "");

      // Store raw individual detections for rendering bounding boxes on the image
      setRawDetections(items);

      // Group identical items by name for the confirmation list and DB storage
      const groupedMap: Record<string, typeof items[0]> = {};
      items.forEach((item: any) => {
        const key = item.name.trim().toLowerCase();
        if (groupedMap[key]) {
          groupedMap[key].quantity += item.quantity;
          if (groupedMap[key].category === "other" && item.category !== "other") {
            groupedMap[key].category = item.category;
          }
        } else {
          groupedMap[key] = { ...item };
        }
      });

      const groupedItems = Object.values(groupedMap).map((item: any) => ({
        ...item,
        quantity: formatQuantity(item.quantity, item.unit)
      }));

      setDetectedItems(groupedItems);
      
      if (groupedItems.length > 0) {
        setSubmitMessage(`สแกนสำเร็จ! พบวัตถุดิบ ${groupedItems.length} ชนิด (แยกตรวจจับ ${items.length} ชิ้น) กรุณาตรวจสอบก่อนบันทึก 👇`);
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

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isScanning && fileInputRef.current?.click()}
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${isScanning
              ? "border-primary-light bg-surface-alt cursor-wait animate-pulse"
              : isDragging
                ? "border-primary bg-primary-pale/50 scale-[1.01] shadow-[0_0_0_4px_rgba(37,99,235,0.15),0_0_32px_8px_rgba(37,99,235,0.2)]"
                : "border-outline hover:border-primary-light hover:bg-surface-alt scanner-zone-glow"
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
            className="relative mx-auto w-full max-w-2xl lg:max-w-4xl rounded-2xl border-4 border-white bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-0 overflow-visible transition-all duration-300 cursor-zoom-in animate-scale-in"
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
            {!isScanning && visibleDetections.map((det, idx) => {
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
                  className="absolute border-2 border-accent-green bg-transparent rounded-lg group hover:border-emerald-600 hover:bg-transparent transition-all duration-200"
                >
                  <span className={
                    isNearTop
                      ? "absolute top-1.5 left-1.5 rounded-md bg-accent-green/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-success shadow-md whitespace-nowrap transition-all duration-200"
                      : "absolute -top-6 left-0 rounded-md bg-accent-green/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-heading font-bold text-success shadow-md whitespace-nowrap transition-all duration-200"
                  }>
                    {det.name} ({det.quantity} {det.unit})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          {!isScanning && (
            <button
              onClick={() => { setPreviewUrl(null); setScanResult(null); setDetectedItems([]); }}
              className="mx-auto flex items-center justify-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] max-w-xs"
            >
              สแกนรูปภาพใหม่
            </button>
          )}
        </div>
      )}

      {/* ─── Confirmation Form list ─── */}
      {!isScanning && detectedItems.length > 0 && (
        <div className="rounded-2xl border-2 border-white bg-surface p-6 shadow-soft-blue animate-scale-in flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline pb-3">
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              📋 ยืนยันวัตถุดิบที่ตรวจพบ ({detectedItems.length} รายการ)
            </h3>
            <span className="text-xs text-foreground-muted font-body">คุณสามารถแก้ไขข้อมูลได้ก่อนบันทึกจริง</span>
          </div>

          <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-1">
            {detectedItems.map((item, idx) => (
              <div 
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-outline bg-surface-alt/40 transition-airy hover:bg-surface-alt/80"
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
                    className="flex-1 sm:w-44 rounded-xl border-2 border-white bg-surface px-3 py-1.5 text-sm font-heading font-semibold text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none"
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
                      className="w-16 rounded-xl border-2 border-white bg-surface px-2 py-1.5 text-center text-sm font-body text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none"
                    />
                  </div>

                  {/* Unit Select */}
                  <select
                    value={item.unit}
                    onChange={(e) => updateDetectedItemField(idx, "unit", e.target.value)}
                    className="rounded-xl border-2 border-white bg-surface px-2.5 py-1.5 text-xs font-body text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none"
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>

                  {/* Category Select */}
                  <select
                    value={item.category}
                    onChange={(e) => updateDetectedItemField(idx, "category", e.target.value)}
                    className="rounded-xl border-2 border-white bg-surface px-2.5 py-1.5 text-xs font-body text-foreground shadow-soft-blue transition-airy focus:border-primary-light focus:outline-none"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>

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
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-green to-emerald-600 py-3.5 text-base font-heading font-bold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
              "📥 ยืนยันข้อมูลทั้งหมด และบันทึกเข้าตู้เย็น"
            )}
          </button>
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
            {visibleDetections.map((det, idx) => {
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
                  className="absolute border-2 border-emerald-500 bg-transparent rounded-lg"
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