import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-body py-12 px-6">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 bg-white">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </Link>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 mb-6 tracking-tight">เงื่อนไขการใช้งาน</h1>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
          <p className="text-sm text-slate-400 mb-8">อัปเดตล่าสุด: 18 มิถุนายน 2026</p>
          
          <p className="mb-6">
            ยินดีต้อนรับสู่แอปพลิเคชัน <strong>TUYEN</strong> กรุณาอ่านเงื่อนไขและข้อตกลงในการใช้งานเหล่านี้อย่างละเอียดก่อนเริ่มต้นใช้งานแอปพลิเคชันของเรา
          </p>
          
          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">1. การยอมรับข้อตกลง</h2>
          <p className="mb-6">
            การเข้าถึงและใช้งานแอปพลิเคชันนี้ ถือว่าคุณยอมรับเงื่อนไขและข้อกำหนดทั้งหมด หากคุณไม่เห็นด้วยกับส่วนหนึ่งส่วนใดของข้อตกลง กรุณางดเว้นการใช้งาน
          </p>

          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">2. คำแนะนำด้านสุขภาพ (Disclaimer)</h2>
          <p className="mb-6">
            ข้อมูลสูตรอาหาร การคำนวณแคลอรี่ และคำแนะนำทางโภชนาการต่างๆ ที่ปรากฏในแอป เป็นไปเพื่อเป็นแนวทางเบื้องต้นเท่านั้น ไม่สามารถใช้ทดแทนคำแนะนำจากแพทย์หรือนักโภชนาการผู้เชี่ยวชาญได้ หากคุณมีโรคประจำตัวหรือข้อจำกัดด้านอาหาร กรุณาปรึกษาแพทย์ก่อนการบริโภค
          </p>

          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">3. ความรับผิดชอบต่อบัญชี</h2>
          <p>
            คุณมีหน้าที่รับผิดชอบในการรักษาความปลอดภัยของรหัสผ่านและข้อมูลบัญชีของคุณ กิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณถือเป็นความรับผิดชอบของคุณเอง
          </p>
        </div>
      </div>
    </div>
  );
}
