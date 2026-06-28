"use client";

import { useState, useRef, useEffect } from "react";
import { Scan } from "lucide-react";
import { inventoryAPI, aiAPI, type InventoryItem } from "@/lib/api";

// Import Subcomponents
import ScannerDropzone from "./scanner/ScannerDropzone";
import ScannerConfirmationList from "./scanner/ScannerConfirmationList";
import ScannerManualForm from "./scanner/ScannerManualForm";
import ScannerInventoryList from "./scanner/ScannerInventoryList";

export default function ScannerView() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── AI Scan State ───
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scanningTexts = [
    "SmartFood AI กำลังวิเคราะห์รูปภาพของคุณ...",
    "กำลังสกัดแยกแยะวัตถุดิบและส่วนประกอบ...",
    "กำลังประเมินปริมาณและวันหมดอายุ...",
    "ใกล้เสร็จแล้ว เตรียมนำเข้าตู้เย็น..."
  ];

  const [scanTextIndex, setScanTextIndex] = useState(0);

  useEffect(() => {
    const scanningTextsLength = 4;
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

  // ─── Form & Message State ───
  const [showManualForm, setShowManualForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  // Note: Memory leak fixed, use ref for timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMessage = (msg: string, duration = 4000) => {
    setSubmitMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSubmitMessage("");
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
  const categoryEmoji: Record<string, string> = {
    protein: "🥩",
    veggie: "🥦",
    fruit: "🍎",
    dairy: "🧀",
    grain: "🌾",
    other: "📦",
  };

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
      showMessage(`สแกนและนำเข้าตู้เย็นสำเร็จ ${addedItems.length} รายการ! ✅`);
      setDetectedItems([]);
      setRawDetections([]);
      setPreviewUrl(null);
      setSelectedFile(null);
      loadInventory();
    } catch (err) {
      console.error("Failed to add bulk inventory:", err);
      showMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่ ❌");
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

  useEffect(() => {
    loadInventory();
  }, []);

  const handleManualSubmit = async (itemData: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    expiry_date?: string;
  }) => {
    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const newItem = await inventoryAPI.addManual(itemData);
      setInventoryItems((prev) => [newItem, ...prev]);
      showMessage(`เพิ่ม "${newItem.name}" ลงตู้เย็นสำเร็จ! ✅`, 3000);
    } catch (err) {
      console.error("Failed to add item:", err);
      showMessage("เพิ่มวัตถุดิบล้มเหลว กรุณาลองใหม่ ❌", 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น ❌");
      return;
    }

    setSelectedFile(file);
    setSubmitMessage("");
    setDetectedItems([]);
    setRawDetections([]);

    const previewReader = new FileReader();
    previewReader.onload = () => {
      setPreviewUrl(previewReader.result as string);
    };
    previewReader.readAsDataURL(file);
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setSubmitMessage("");
    setDetectedItems([]);
    setRawDetections([]);

    try {
      const compressedBase64 = await compressImage(selectedFile, 1024, 1024);
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
      }).filter((item: { name: string }) => item.name !== "");

      setRawDetections(items);

      const groupedMap: Record<string, typeof items[0]> = {};
      items.forEach((item: typeof items[0]) => {
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

      const groupedItems = Object.values(groupedMap).map((item: typeof items[0]) => ({
        ...item,
        quantity: formatQuantity(item.quantity, item.unit)
      }));

      setDetectedItems(groupedItems);

      if (groupedItems.length > 0) {
        showMessage(`สแกนสำเร็จ! พบวัตถุดิบ ${groupedItems.length} ชนิด (แยกตรวจจับ ${items.length} ชิ้น) กรุณาตรวจสอบก่อนบันทึก 👇`, 6000);
      } else {
        showMessage("สแกนภาพสำเร็จ แต่ไม่พบวัตถุดิบ 🔍");
      }
    } catch (err: unknown) {
      console.error("AI Scan failed:", err);
      showMessage(`เกิดข้อผิดพลาดในการสแกน: ${(err as Error).message || "กรุณาลองใหม่"} ❌`);
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

  const handleResetScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedItems([]);
    setRawDetections([]);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-heading font-bold text-foreground">
          <Scan className="h-6 w-6 text-primary" />
          สแกนวัตถุดิบเข้าตู้เย็น
        </h2>
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

      <ScannerDropzone
        isScanning={isScanning}
        isDragging={isDragging}
        previewUrl={previewUrl}
        visibleDetections={visibleDetections}
        scanningTexts={scanningTexts}
        scanTextIndex={scanTextIndex}
        isZoomed={isZoomed}
        setIsZoomed={setIsZoomed}
        fileInputRef={fileInputRef}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        handleResetScan={handleResetScan}
        handleStartScan={handleStartScan}
        hasDetections={detectedItems.length > 0}
      />

      <ScannerConfirmationList
        detectedItems={detectedItems}
        isSubmitting={isSubmitting}
        unitOptions={unitOptions}
        categoryOptions={categoryOptions}
        updateDetectedItemField={updateDetectedItemField}
        deleteDetectedItem={deleteDetectedItem}
        handleConfirmStore={handleConfirmStore}
      />

      <ScannerManualForm
        showManualForm={showManualForm}
        setShowManualForm={setShowManualForm}
        unitOptions={unitOptions}
        categoryOptions={categoryOptions}
        isSubmitting={isSubmitting}
        onManualSubmit={handleManualSubmit}
      />

      <ScannerInventoryList
        inventoryItems={inventoryItems}
        isLoadingInventory={isLoadingInventory}
        categoryEmoji={categoryEmoji}
        handleDelete={handleDelete}
      />
    </div>
  );
}
