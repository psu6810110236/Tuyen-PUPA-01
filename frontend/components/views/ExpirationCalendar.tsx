"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import "react-day-picker/style.css";
import { Calendar as CalendarIcon, Clock, ChefHat, Bell, CheckCircle } from "lucide-react";
import { type InventoryItem } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  items: (InventoryItem & { icon?: string; daysLeft?: number })[];
}

export default function ExpirationCalendar({ items }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && !(window as any).google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      return () => {
        // Clean up if component unmounts quickly
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const handleSyncCalendar = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (!g) {
      toast.error("ไม่สามารถโหลดระบบ Google ได้ กรุณาลองใหม่");
      return;
    }

    // Filter items from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingItems = itemsWithExpiry.filter(item => {
      const d = new Date(item.expiry_date!);
      return d >= today;
    });

    if (upcomingItems.length === 0) {
      toast.error("ไม่มีวัตถุดิบที่ต้องซิงค์ในตู้เย็นของคุณ");
      return;
    }

    setIsSyncing(true);

    const client = g.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "408931547857-7h808kgru96q0ij7ej4o2vstmkdo5iho.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/calendar.events",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          try {
            toast.loading("กำลังซิงค์ปฏิทิน...");
            
            // Group by date
            const grouped = new Map<string, typeof upcomingItems>();
            upcomingItems.forEach(item => {
              const dateKey = format(new Date(item.expiry_date!), "yyyy-MM-dd");
              if (!grouped.has(dateKey)) grouped.set(dateKey, []);
              grouped.get(dateKey)!.push(item);
            });

            // Create events
            for (const [dateString, dayItems] of Array.from(grouped.entries())) {
              const itemListStr = dayItems.map(i => `- ${i.name} (${i.quantity} ${i.unit})`).join("\\n");
              const event = {
                summary: `🥬 [TUYEN] วัตถุดิบหมดอายุ ${dayItems.length} รายการ`,
                description: `แจ้งเตือนวัตถุดิบหมดอายุจากตู้เย็นของคุณ:\\n\\n${itemListStr}\\n\\nเปิดแอป TUYEN เพื่อหาเมนูแนะนำ!`,
                start: { date: dateString },
                end: { date: dateString },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: "popup", minutes: 24 * 60 } // 1 day before
                  ]
                }
              };

              await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${tokenResponse.access_token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(event)
              });
            }
            
            toast.dismiss();
            toast.success("ซิงค์วันหมดอายุเข้า Google Calendar สำเร็จ!");
          } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.error("เกิดข้อผิดพลาดในการสร้าง Event บนปฏิทิน");
          } finally {
            setIsSyncing(false);
          }
        } else {
          setIsSyncing(false);
          toast.error("การขอสิทธิ์เข้าถึงปฏิทินถูกยกเลิก");
        }
      },
      error_callback: () => {
        setIsSyncing(false);
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
      }
    });

    client.requestAccessToken();
  };
  
  // Filter items that have expiry dates
  const itemsWithExpiry = items.filter(item => item.expiry_date);
  
  // Identify days that have expiring items
  const expiringDays = itemsWithExpiry.map(item => {
    // Parse the date and normalize to midnight local time to avoid timezone shifts
    const d = new Date(item.expiry_date!);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  
  // Get items expiring on the selected date
  const selectedItems = itemsWithExpiry.filter(item => {
    if (!selectedDate || !item.expiry_date) return false;
    const d = new Date(item.expiry_date);
    const normalizedExpiry = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const normalizedSelected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return isSameDay(normalizedExpiry, normalizedSelected);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in pb-10">
      {/* ── Calendar View ── */}
      <div className="glass-card rounded-3xl p-6 shadow-card border border-outline flex flex-col items-center w-full lg:w-auto">
         <DayPicker 
           mode="single"
           selected={selectedDate}
           onSelect={(date) => date && setSelectedDate(date)}
           locale={th}
           modifiers={{ expiring: expiringDays }}
           modifiersClassNames={{
             expiring: "bg-red-50 text-red-600 font-bold border border-red-100"
           }}
           style={{
             "--rdp-accent-color": "#5c7cfa",
             "--rdp-background-color": "#eff6ff",
             "--rdp-day_button-border-radius": "12px",
             "--rdp-today-color": "#5c7cfa"
           } as React.CSSProperties}
           className="font-body custom-calendar p-2"
         />
         <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-bold">
           <div className="w-2 h-2 rounded-full bg-red-500"></div>
           <span>วันที่วัตถุดิบหมดอายุ</span>
         </div>
      </div>

      {/* ── Details View ── */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="glass-card rounded-3xl p-6 shadow-card border border-outline flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading font-extrabold text-slate-900 drop-shadow-sm">
              {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: th }) : "เลือกวันที่"}
            </h3>
            {selectedItems.length > 0 && (
              <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                {selectedItems.length} รายการ
              </span>
            )}
          </div>
          
          {selectedItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 to-orange-50/30 hover:shadow-sm transition-airy gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm border border-red-100 shrink-0">
                      {item.icon || "🛒"}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-slate-900 text-base">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-red-500" />
                        <p className="text-xs text-red-600 font-bold tracking-tight">หมดอายุวันนี้</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">เหลือ {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <button 
                    className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 transition-airy active:scale-95"
                    onClick={() => {
                      toast.success(`กำลังค้นหาเมนูสำหรับ ${item.name}...`);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("navigate", { detail: "recipe" }));
                      }, 500);
                    }}
                  >
                    <ChefHat className="h-4 w-4" /> แนะนำเมนู
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500 h-[200px]">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="font-heading text-base font-bold text-slate-800">ไม่มีวัตถุดิบหมดอายุ</p>
              <p className="text-xs mt-1.5 font-medium max-w-[200px] leading-relaxed">ของในตู้เย็นของคุณปลอดภัยดีในวันนี้!</p>
            </div>
          )}
        </div>

        {/* ── Sync Card ── */}
        <div className="glass-card rounded-3xl p-5 shadow-sm border border-blue-100 bg-gradient-to-r from-blue-50/80 to-sky-50/50 flex flex-col sm:flex-row items-center gap-5 group hover:border-blue-200 transition-airy">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-heading font-bold text-blue-950 text-sm">แจ้งเตือนเข้ามือถือ</h4>
            <p className="text-[11px] text-blue-800/70 mt-1 font-medium leading-relaxed">ซิงค์วันหมดอายุเข้า Google Calendar ของคุณ เพื่อรับแจ้งเตือนล่วงหน้า</p>
          </div>
          <button 
            className="whitespace-nowrap px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-700 transition-airy shadow-sm flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSyncCalendar}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                กำลังซิงค์...
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" /> ซิงค์ปฏิทิน
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
