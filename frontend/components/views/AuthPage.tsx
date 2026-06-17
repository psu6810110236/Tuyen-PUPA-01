"use client";

import { useState, useEffect } from "react";
import { useAuth, APIError } from "@/components/AuthContext";
import { 
  AlertCircle, CheckCircle, Shield, Camera, 
  ChefHat, ShoppingCart, Activity, ArrowRight,
  Sparkles, Check, X as XIcon, Star, User
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { login, loginGoogle, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openLogin = () => {
    setMode("login");
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setMode("register");
    setShowAuthModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      await loginGoogle(response.credential);
      toast.success("เข้าสู่ระบบด้วย Google สำเร็จ!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error(err.message || "การเข้าสู่ระบบด้วย Google ล้มเหลว");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!showAuthModal) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (g) {
        g.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "408931547857-7h808kgru96q0ij7ej4o2vstmkdo5iho.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        
        const btnWidth = Math.max(200, Math.min(window.innerWidth - 112, 356));
        
        g.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: btnWidth.toString(), 
            text: "signin_with" 
          }
        );
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, showAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน กรุณาลองใหม่");
      return;
    }

    if (password.length < 4) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        await register(username, password);
        toast.success("สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...");
      } else {
        await login(username, password);
        toast.success("เข้าสู่ระบบสำเร็จ!");
      }
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-body selection:bg-primary/20">
      
      {/* ─── Light Soft-Tactile Background Mesh ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#E0F2FE]/60 blur-[100px] animate-mesh-pan" />
        <div className="absolute top-1/2 right-0 h-[600px] w-[600px] rounded-full bg-[#D1FAE5]/40 blur-[120px] animate-mesh-pan" style={{ animationDelay: '-10s' }} />
        <div className="absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-[#DBEAFE]/50 blur-[90px] animate-mesh-pan" style={{ animationDelay: '-5s' }} />
      </div>

      {/* ─── Top Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-header px-6 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-slate-900 tracking-tight text-xl">TUYEN</span>
        </div>
        <button 
          onClick={openLogin}
          className="rounded-full bg-primary px-5 py-2 text-sm font-heading font-semibold text-white shadow-soft-blue hover:bg-primary-dark transition-all active:scale-95"
        >
          เข้าสู่ระบบ
        </button>
      </nav>

      {/* ─── Main Content ─── */}
      <div className="relative z-10 pt-28 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-24">
        
        {/* 1. Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">AI ผู้ช่วยโภชนาการส่วนตัวของคุณ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-6 drop-shadow-sm">
              จัดการตู้เย็นและ <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">สุขภาพของคุณ</span> <br className="hidden sm:block" />
              ได้ง่ายกว่าที่เคย
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              สแกนวัตถุดิบ แนะนำเมนูอาหาร คำนวณแคลอรี่ และสั่งซื้อของที่ขาด ทั้งหมดจบในแอปเดียว ด้วยเทคโนโลยี AI อัจฉริยะ
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={openRegister} className="relative overflow-hidden w-full sm:w-auto rounded-2xl bg-slate-900 px-8 py-4 text-base font-heading font-bold text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:-translate-y-0.5 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                เริ่มต้นใช้งานฟรี <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth'})} className="w-full sm:w-auto rounded-2xl bg-white/80 border border-slate-200 px-8 py-4 text-base font-heading font-bold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all active:scale-95 shadow-sm">
                ดูฟีเจอร์เด่น
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-white flex items-center justify-center text-[10px] font-bold text-slate-600">+10k</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 mb-0.5">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-xs text-slate-500 font-medium">ผู้ใช้งานเพื่อสุขภาพกว่า 10,000+ คน</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Hook: Smart Ingredients Float */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none h-[400px] flex items-center justify-center perspective-1000">
            <div className="relative z-10 w-[240px] h-[480px] glass-panel rounded-[2rem] border-4 border-white/60 shadow-2xl overflow-hidden flex flex-col bg-slate-50 animate-float">
              <div className="bg-primary/5 h-48 p-4 flex flex-col justify-end">
                <h3 className="font-heading font-bold text-slate-800 text-lg drop-shadow-sm">เมนูแนะนำวันนี้</h3>
                <p className="text-xs text-slate-500 font-medium">ไข่เจียวหมูสับทรงเครื่อง</p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {/* Skeleton Shimmer Loaders */}
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-slate-200 shadow-inner" />
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-12 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3 animate-pulse" style={{ animationDelay: '150ms' }}>
                  <div className="h-10 w-10 rounded-full bg-slate-200 shadow-inner" />
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3 animate-pulse" style={{ animationDelay: '300ms' }}>
                  <div className="h-10 w-10 rounded-full bg-slate-200 shadow-inner" />
                  <div className="flex-1">
                    <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-10 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-1/4 -left-8 sm:-left-12 z-20 glass-card rounded-xl p-3 flex items-center gap-3 shadow-xl animate-float-delayed border border-white/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">ไข่ไก่ (6 ฟอง)</p>
                <p className="text-[10px] text-emerald-600 font-bold">มีในตู้เย็นแล้ว</p>
              </div>
            </div>

            <div className="absolute bottom-1/4 -right-8 sm:-right-12 z-20 glass-card rounded-xl p-3 flex items-center gap-3 shadow-xl animate-float border border-white/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 shadow-inner">
                <XIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">หมูสับ (200g)</p>
                <p className="text-[10px] text-red-600 font-bold">ต้องซื้อเพิ่ม</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Bento Grid Features */}
        <section id="features" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4 drop-shadow-sm">ทำไมต้องใช้ TUYEN?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium">ฟีเจอร์ครบวงจรที่ออกแบบมาเพื่อทำให้เรื่องกินของคุณเป็นเรื่องง่ายและสุขภาพดีที่สุด</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[240px]">
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(92,124,250,0.12)] lg:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-blue-200">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">AI Vision Scanner</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md font-medium">แค่ถ่ายรูปตู้เย็น AI จะรู้ทันทีว่าคุณมีวัตถุดิบอะไรบ้าง พร้อมบอกวันหมดอายุและแจ้งเตือนก่อนของเสีย</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group hover:-translate-y-1 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-emerald-200">
                <ChefHat className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">เสกเมนูจากของที่มี</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">AI แนะนำสูตรอาหารจากของที่เหลือในตู้เย็น ไม่ต้องคิดเมนูเองให้ปวดหัว</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group hover:-translate-y-1 hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(168,85,247,0.12)]">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-purple-200">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">ติดตามโภชนาการ</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">คำนวณแคลอรี่และสารอาหารอัตโนมัติจากเมนูที่คุณกิน พร้อมตั้งเป้าหมายสุขภาพได้</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group hover:-translate-y-1 hover:border-orange-500/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] lg:col-span-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-50/80 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-orange-200 relative z-10">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100 border border-orange-200 text-orange-800 text-[10px] font-bold mb-3 shadow-sm">
                  NEW FEATURE
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">เชื่อมต่อ Lotus&apos;s & LINE</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md font-medium">วัตถุดิบไหนขาด? ระบบจะสร้าง Shopping List และส่งไปสั่งซื้อผ่าน Lotus&apos;s หรือ LINE อัตโนมัติ จบในคลิกเดียว</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Demo / How it works */}
        <section className="py-12 border-y border-white/50 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-bold text-slate-900 drop-shadow-sm">ใช้งานง่ายใน 3 ขั้นตอน</h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-slate-200 -z-10" />
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-white shadow-soft-blue border border-blue-100 flex items-center justify-center mb-4 text-primary font-heading font-black text-xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(92,124,250,0.3)] transition-all">1</div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Camera className="w-4 h-4 text-slate-400"/> สแกนตู้เย็น</h4>
              <p className="text-sm text-slate-600 font-medium">ใช้กล้องสแกนของที่มี ระบบจะบันทึกอัตโนมัติ</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-white shadow-soft-blue border border-emerald-100 flex items-center justify-center mb-4 text-emerald-500 font-heading font-black text-xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">2</div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><ChefHat className="w-4 h-4 text-slate-400"/> เลือกเมนู & ปรุงอาหาร</h4>
              <p className="text-sm text-slate-600 font-medium">AI แนะนำสูตรเด็ด ทำตามง่ายๆ และอร่อยชัวร์</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-white shadow-soft-blue border border-purple-100 flex items-center justify-center mb-4 text-purple-500 font-heading font-black text-xl group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">3</div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400"/> บันทึกสุขภาพ</h4>
              <p className="text-sm text-slate-600 font-medium">ดูสถิติแคลอรี่ง่ายๆ เพื่อหุ่นและสุขภาพที่ดีขึ้น</p>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 backdrop-blur-md py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-slate-900 tracking-tight text-lg">TUYEN</span>
          </div>
          <p className="text-xs font-medium text-slate-500">© 2026 TUYEN App. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <Link href="/privacy" className="hover:text-primary transition-colors">ความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">เงื่อนไขการใช้งาน</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
          </div>
        </div>
      </footer>

      {/* ─── Matte Finish Auth Modal ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setShowAuthModal(false)}
            aria-label="Close modal"
          />
          
          <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
            {/* Form Card - Matte Solid Finish */}
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 relative">
              
              {/* Close Button */}
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
              >
                <XIcon className="h-5 w-5" />
              </button>

              <div className="text-center mb-6 pt-2">
                <h2 className="text-2xl font-heading font-bold text-slate-900 mb-1 drop-shadow-sm">
                  {mode === "login" ? "ยินดีต้อนรับกลับมา!" : "เริ่มต้นสุขภาพดีกับเรา"}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {mode === "login" ? "เข้าสู่ระบบเพื่อจัดการตู้เย็นของคุณ" : "สมัครสมาชิกฟรีวันนี้"}
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="mb-6 flex rounded-xl bg-slate-100/80 p-1 border border-white/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-heading font-bold transition-all ${
                    mode === "login"
                      ? "bg-white text-primary shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-heading font-bold transition-all ${
                    mode === "register"
                      ? "bg-white text-primary shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              {/* Form with Floating Labels */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
                
                {/* Username Input */}
                <div className="relative">
                  <input
                    id="auth-username"
                    type="text"
                    placeholder="ชื่อผู้ใช้งาน"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="peer w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pt-5 pb-2 text-sm font-body text-slate-800 placeholder-transparent transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <label 
                    htmlFor="auth-username" 
                    className="absolute left-4 top-2 text-[10px] font-bold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary cursor-text pointer-events-none"
                  >
                    ชื่อผู้ใช้งาน
                  </label>
                </div>

                {/* Password Input */}
                <div className="relative mt-2">
                  <input
                    id="auth-password"
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="peer w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pt-5 pb-2 text-sm font-body text-slate-800 placeholder-transparent transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <label 
                    htmlFor="auth-password" 
                    className="absolute left-4 top-2 text-[10px] font-bold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary cursor-text pointer-events-none"
                  >
                    รหัสผ่าน
                  </label>
                </div>

                {/* Confirm Password Input (Register Only) */}
                {mode === "register" && (
                  <div className="relative mt-2 animate-fade-in">
                    <input
                      id="auth-confirm-password"
                      type="password"
                      placeholder="ยืนยันรหัสผ่าน"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="peer w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pt-5 pb-2 text-sm font-body text-slate-800 placeholder-transparent transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                    <label 
                      htmlFor="auth-confirm-password" 
                      className="absolute left-4 top-2 text-[10px] font-bold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-primary cursor-text pointer-events-none"
                    >
                      ยืนยันรหัสผ่าน
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-heading font-bold text-white shadow-[0_8px_20px_-6px_rgba(92,124,250,0.5)] transition-all hover:bg-primary-dark hover:shadow-[0_8px_24px_-4px_rgba(92,124,250,0.6)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังดำเนินการ...
                    </>
                  ) : mode === "login" ? (
                    "เข้าสู่ระบบ"
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">หรือเชื่อมต่อด้วย</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google Sign-in Button */}
              <div className="w-full flex justify-center mt-2">
                <div id="google-signin-btn" className="flex justify-center"></div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-body text-white bg-slate-800/60 backdrop-blur-md rounded-full py-2 px-4 w-max mx-auto shadow-lg border border-white/20">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
