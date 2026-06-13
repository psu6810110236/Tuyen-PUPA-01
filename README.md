# 🛒 TUYEN (Smart Fridge Chef)

เว็บแอปพลิเคชันผู้ช่วยจัดการตู้เย็นและโภชนาการอัจฉริยะแบบ Gamification ทำงานร่วมกับ AI

## 🛠️ Tech Stack ของโปรเจกต์

*   **Frontend:** Next.js, Tailwind CSS (Mobile-first, Premium UI)
*   **Backend:** FastAPI, PostgreSQL (ทำหน้าที่เป็นสมองกล)
*   **AI Agent:** FastMCP, Gemini Vision (วิเคราะห์ภาพวัตถุดิบ), Spoonacular API
*   **Database:** PostgreSQL (รันผ่าน Docker Container)
*   **Deployment:** AWS EC2, Docker, GitHub Actions

## 📂 โครงสร้างโฟลเดอร์และการพัฒนา (Monorepo Architecture)

*   `/frontend` : ส่วนติดต่อผู้ใช้งานแอปพลิเคชันหน้าบ้าน (Next.js + Tailwind CSS)
*   `/backend` : ระบบหลังบ้าน สมองส่วนกลางเชื่อม AI และฐานข้อมูล (FastAPI)
*   `.github` : ระบบทำงานอัตโนมัติ CI และ CD

## 🚀 การเริ่มต้นโปรเจคในเครื่อง Local (ด้วย Docker Compose)

1. คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกข้อมูล API Key ของตนเอง
2. รันทั้งฐานข้อมูลและระบบหลังบ้านพร้อมกันโดยใช้คำสั่งที่โฟลเดอร์ Root:
   ```bash
   docker compose up --build
   ```
   *(หมายเหตุ: ระบบได้ทำ Volume Mount สำหรับโฟลเดอร์ `/backend` ไว้แล้ว ทำให้เวลาแก้โค้ดหลังบ้านจะทำการ Reload อัตโนมัติใน Docker ทันที)*

3. ฝั่ง Frontend เข้าไปรันพัฒนาหน้าเว็บ:
   ```bash
   cd frontend
   npm run dev
   ```