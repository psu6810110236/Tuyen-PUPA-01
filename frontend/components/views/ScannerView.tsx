"use client";

import { useState, useRef } from "react";
import { inventoryAPI, aiAPI } from "@/lib/api";
import { Camera, UploadCloud, CheckCircle, XCircle, Package } from "lucide-react";

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
  const [submitMessage, setSubmitMessage] = useState("");

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
            <p className="text-sm font-heading font-semibold text-primary">กำลังวิเคราะห์รูปภาพ...</p>
            <p className="text-xs font-body text-foreground-muted">ระบบกำลังระบุวัตถุดิบเพื่อนำเข้าตู้เย็น</p>
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
            <p className="mt-1.5 text-xs font-body text-foreground-secondary font-medium">ระบบจะวิเคราะห์และเพิ่มวัตถุดิบอัตโนมัติ</p>
          </>
        )}
      </div>

      {scanResult && (
        <div className="rounded-2xl border-2 border-white bg-surface p-4 shadow-soft-blue animate-scale-in">
          <p className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> ผลการสแกน:
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


    </div>
  );
}
