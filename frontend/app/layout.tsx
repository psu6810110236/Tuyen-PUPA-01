import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/AuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

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
    <html lang="th" className={cn("h-full", plusJakarta.variable, inter.variable)}>
      <body className="min-h-full font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
