"use client";

import { useState, useRef } from "react";
import { inventoryAPI, aiAPI } from "@/lib/api";
import { Camera, UploadCloud, CheckCircle, XCircle, Package, X } from "lucide-react";

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
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      setPreviewUrl(reader.result as string);
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

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isScanning && fileInputRef.current?.click()}
          className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
            isDragging
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
          {/* Upload Icon */}
          <div className={`mb-4 rounded-2xl p-4 transition-all duration-300 ${isDragging ? "bg-primary-pale" : "bg-surface-alt"}`}>
            <UploadCloud className={`h-12 w-12 transition-colors duration-300 ${isDragging ? "text-primary-dark" : "text-foreground-muted"}`} />
          </div>

          <p className="text-base font-heading font-semibold text-foreground">
            {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางหรือแตะเพื่อถ่ายรูป"}
          </p>
          <p className="mt-1 text-sm font-body text-foreground-secondary">หรือคลิกเพื่อเลือกไฟล์</p>
          <p className="mt-2 text-xs font-body text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
          <p className="mt-1.5 text-xs font-body text-foreground-secondary font-medium">ระบบจะวิเคราะห์และเพิ่มวัตถุดิบอัตโนมัติ</p>
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
            className="relative mx-auto w-full max-w-2xl lg:max-w-4xl rounded-2xl border-4 border-white bg-surface shadow-soft-blue p-0 overflow-visible transition-all duration-300 cursor-zoom-in"
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
                  className="absolute border-2 border-emerald-500 bg-transparent rounded-lg group hover:border-emerald-600 hover:bg-transparent transition-all duration-200"
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

          {/* Action buttons */}
          {!isScanning && (
            <button
              onClick={() => { setPreviewUrl(null); setScanResult(null); }}
              className="mx-auto flex items-center justify-center gap-2 rounded-full border-2 border-white bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-heading font-semibold text-white shadow-soft-blue transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99] max-w-xs"
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
