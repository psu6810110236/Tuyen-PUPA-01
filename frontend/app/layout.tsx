import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "TUYEN - ผู้ช่วยโภชนาการอัจฉริยะ",
  description:
    "แอปพลิเคชันวิเคราะห์โภชนาการด้วย AI สำหรับการดูแลสุขภาพอย่างชาญฉลาด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="min-h-full font-thai antialiased">{children}</body>
    </html>
  );
}
