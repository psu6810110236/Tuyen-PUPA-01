import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-body py-12 px-6">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 bg-white">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </Link>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 mb-6 tracking-tight">นโยบายความเป็นส่วนตัว</h1>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
          <p className="text-sm text-slate-400 mb-8">อัปเดตล่าสุด: 18 มิถุนายน 2026</p>
          
          <p>
            แอปพลิเคชัน <strong>TUYEN</strong> ให้ความสำคัญกับความเป็นส่วนตัวของคุณเป็นอันดับแรก ข้อมูลเกี่ยวกับวัตถุดิบในตู้เย็น พฤติกรรมการบริโภค และข้อมูลสุขภาพส่วนบุคคลของคุณจะถูกจัดเก็บอย่างปลอดภัยที่สุดด้วยเทคโนโลยีการเข้ารหัสมาตรฐานสากล
          </p>
          
          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">1. ข้อมูลที่เราจัดเก็บ</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>ข้อมูลบัญชีผู้ใช้ (อีเมล, ชื่อที่ใช้แสดง)</li>
            <li>ข้อมูลวัตถุดิบและรายการซื้อของที่คุณบันทึกในแอป</li>
            <li>สถิติการรับประทานอาหารและปริมาณแคลอรี่ที่ประมวลผล</li>
          </ul>

          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">2. การนำข้อมูลไปใช้งาน</h2>
          <p className="mb-6">
            ข้อมูลของคุณจะถูกนำไปใช้เพื่อประมวลผลผ่านระบบ AI ของเรา เพื่อค้นหาสูตรอาหารที่เหมาะสม และให้คำแนะนำด้านโภชนาการที่ตรงกับร่างกายของคุณเท่านั้น ทางเราไม่มีนโยบายการจำหน่ายข้อมูลผู้ใช้ให้กับบุคคลที่ 3 (Third-party) โดยเด็ดขาด
          </p>

          <h2 className="text-xl font-heading font-bold text-slate-800 mt-8 mb-4">3. สิทธิ์ของคุณ</h2>
          <p>
            คุณมีสิทธิ์ในการเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณออกจากระบบของ TUYEN ได้ตลอดเวลาผ่านหน้าการตั้งค่า หรือติดต่อเราโดยตรง
          </p>
        </div>
      </div>
    </div>
  );
}
