"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-body py-12 px-6">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 bg-white">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 mb-2 tracking-tight">ติดต่อเรา</h1>
        <p className="text-slate-500 mb-8 font-medium">มีข้อสงสัยหรือต้องการความช่วยเหลือ? ทีมงาน TUYEN ยินดีให้บริการเสมอ</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">ช่องทางการติดต่อ</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">อีเมล</p>
                <p className="text-sm text-slate-600 mt-1">support@tuyenapp.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">เบอร์โทรศัพท์</p>
                <p className="text-sm text-slate-600 mt-1">02-XXX-XXXX (จันทร์-ศุกร์ 9:00 - 18:00 น.)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">ที่ตั้งสำนักงาน</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  ตึกออฟฟิศจำลอง (Mockup Building)<br />
                  ชั้น 99 ถนนสุขุมวิท<br />
                  กรุงเทพมหานคร 10110
                </p>
              </div>
            </div>
          </div>

          {/* Dummy Contact Form */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-lg font-heading font-bold text-slate-800 mb-4">ส่งข้อความหาเรา</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("ส่งข้อความสำเร็จ! (นี่คือหน้าต่างจำลอง)"); }}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="กรอกชื่อของคุณ" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล</label>
                <input type="email" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ข้อความ</label>
                <textarea rows={4} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="พิมพ์ข้อความที่ต้องการติดต่อ..." required></textarea>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                ส่งข้อความ
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
