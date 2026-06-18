import React from "react";
import { X, ImagePlus, Sparkles } from "lucide-react";

type ScannerDropzoneProps = {
  isScanning: boolean;
  isDragging: boolean;
  previewUrl: string | null;
  visibleDetections: Array<{
    name: string;
    quantity: number;
    unit: string;
    box_2d: number[];
  }>;
  scanningTexts: string[];
  scanTextIndex: number;
  isZoomed: boolean;
  setIsZoomed: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleResetScan: () => void;
};

export default function ScannerDropzone({
  isScanning,
  isDragging,
  previewUrl,
  visibleDetections,
  scanningTexts,
  scanTextIndex,
  isZoomed,
  setIsZoomed,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  handleResetScan,
}: ScannerDropzoneProps) {
  return (
    <>
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isScanning && fileInputRef.current?.click()}
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
            isScanning
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
              <p className="text-base font-heading font-semibold text-primary transition-opacity duration-300">
                {scanningTexts[scanTextIndex] || scanningTexts[0]}
              </p>
              <p className="text-xs font-body text-foreground-muted">ระบบจะแสกนวัตถุดิบและนำเข้าตู้เย็นโดยอัตโนมัติ</p>
            </div>
          ) : (
            <>
              {/* Upload Icon */}
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 animate-float-icon ${isDragging ? "bg-primary-pale scale-110" : "bg-surface-alt"}`}>
                <ImagePlus className={`h-8 w-8 transition-colors duration-300 ${isDragging ? "text-primary-dark" : "text-foreground-muted"}`} />
              </div>
              <p className="text-base font-heading font-semibold text-foreground">
                {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางรูปภาพวัตถุดิบที่นี่"}
              </p>
              <p className="mt-1 text-sm font-body text-foreground-secondary">หรือคลิกเพื่อเลือกไฟล์</p>
              <p className="mt-2 mb-4 text-xs font-body text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-pale/50 px-3 py-1.5 border border-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-heading font-semibold text-primary-dark">
                  วิเคราะห์ด้วย AI Vision และนำเข้าตู้เย็นทันที
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
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
                  style={{ top, left, width, height, animationDelay: `${idx * 150}ms` }}
                  className="hud-box absolute border-2 border-accent-green bg-transparent rounded-lg group hover:border-emerald-400 hover:bg-emerald-500/10 transition-all duration-300 opacity-0"
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
              onClick={handleResetScan}
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
    </>
  );
}
