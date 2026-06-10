"use client";

import { useState, useRef } from "react";

export default function ScannerView() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recentScans = [
    { name: "ข้าวผัดกระเพรา", calories: 520, confidence: 94, time: "2 ชม. ที่แล้ว" },
    { name: "ส้มตำไทย", calories: 280, confidence: 89, time: "5 ชม. ที่แล้ว" },
    { name: "ต้มยำกุ้ง", calories: 350, confidence: 91, time: "เมื่อวาน" },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop - to be implemented with backend
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">📷 สแกนอาหาร</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          ถ่ายรูปหรืออัปโหลดรูปอาหาร เพื่อวิเคราะห์คุณค่าทางโภชนาการอัตโนมัติ
        </p>
      </div>

      {/* ─── Dropzone ─── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary-pale/50 shadow-glow-teal scale-[1.01]"
            : "border-border hover:border-primary-light hover:bg-surface-alt"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic"
          className="hidden"
        />
        
        {/* Upload Icon */}
        <div className={`mb-4 rounded-2xl p-5 transition-all duration-300 ${isDragging ? 'bg-primary-pale' : 'bg-surface-alt'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-16 w-16 transition-colors duration-300 ${isDragging ? 'text-primary' : 'text-foreground-muted'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        <p className="text-lg font-semibold text-foreground">
          {isDragging ? "ปล่อยเพื่ออัปโหลด" : "ลากวางรูปภาพอาหารที่นี่"}
        </p>
        <p className="mt-1 text-sm text-foreground-secondary">หรือคลิกเพื่อเลือกไฟล์</p>
        <p className="mt-3 text-xs text-foreground-muted">รองรับไฟล์ JPG, PNG, HEIC · ขนาดไม่เกิน 10MB</p>
      </div>

      {/* ─── Or Divider ─── */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium text-foreground-muted">หรือ</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ─── Camera Button ─── */}
      <button className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-4 text-base font-semibold text-white shadow-card transition-airy hover:shadow-glow-teal hover:scale-[1.01] active:scale-[0.99]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        ถ่ายรูปอาหาร
      </button>

      {/* ─── Recent Scans ─── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">🕐 สแกนล่าสุด</h3>
        <div className="flex flex-col gap-3">
          {recentScans.map((scan) => (
            <div
              key={scan.name}
              className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-soft transition-airy hover-lift cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{scan.name}</p>
                  <p className="text-xs text-foreground-muted">{scan.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{scan.calories} kcal</p>
                <p className="text-xs text-success">ความแม่นยำ {scan.confidence}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
