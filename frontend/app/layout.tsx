import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/AuthContext";
import { Toaster } from "sonner";

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
    <html lang="th" className={cn("h-full")}>
      <body className="min-h-full font-body antialiased text-slate-800 bg-background">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-center" toastOptions={{ className: 'font-body' }} />
      </body>
    </html>
  );
}
