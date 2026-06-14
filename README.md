# 🛒 TUYEN (Smart Fridge Chef)

เว็บแอปพลิเคชันผู้ช่วยจัดการตู้เย็นอัจฉริยะและคำนวณโภชนาการด้วยระบบ AI (Smart Fridge & Nutrition Tracker) ที่เชื่อมโยงการทำงานแบบบูรณาการร่วมกันระหว่างหน้าบ้าน หลังบ้าน และโมเดลปัญญาประดิษฐ์

---

## 🌟 ฟีเจอร์เด่นของระบบ (Core Features)
* **📷 AI Vision Scanner**: สแกนภาพวัตถุดิบและอาหารด้วย Gemini Vision AI เพื่อนำเข้าข้อมูลสิ่งของในตู้เย็นโดยอัตโนมัติ (ไม่ต้องพิมพ์กรอกเอง)
* **🍳 Recipe Recommendation System**: ค้นหาสูตรอาหารและแนะนำเมนูเด็ดตามวัตถุดิบที่ผู้ใช้มีอยู่ในตู้เย็น ณ ตอนนั้น (โดยมีระบบ *Mock Recipe Fallback* รองรับอัตโนมัติเมื่อกุญแจ API ภายนอกหมดโควตา ป้องกันระบบระเบิด)
* **🥗 Smart Ingredients Checking**: แยกหมวดหมู่ส่วนผสมของสูตรอาหารออกเป็น **"ของที่มีอยู่แล้วในตู้เย็น (สีเขียว)"** และ **"ของที่ยังขาดอยู่ (สีแดง)"**
* **🛒 Lotus's Price Integration**: แนบลิงก์สำหรับค้นหาราคาและสั่งซื้อวัตถุดิบที่ยังขาดอยู่บนเว็บไซต์ทางการของ Lotus's ประเทศไทยให้ทันที
* **💬 Send Shopping List to LINE**: ปุ่มดึงรายการของที่ต้องซื้อเพิ่มและลิสต์แชร์ส่งต่อเข้าแอปพลิเคชัน LINE เพื่อความสะดวก
* **📊 Daily Nutrition Tracking**: ระบบบันทึกแคลอรี่และสารอาหารหลัก (โปรตีน คาร์โบไฮเดรต ไขมัน) ประจำวันแยกตามมื้ออาหาร

---

## 🛠️ Tech Stack ของระบบ
* **Frontend:** Next.js (App Router), Tailwind CSS (Premium Dark/Neo-brutalism UI Theme)
* **Backend:** FastAPI (Python), PostgreSQL, SQLAlchemy ORM
* **AI Service:** FastAPI, Google GenAI SDK (Gemini 3.1 Flash-Lite), FastMCP
* **Database:** PostgreSQL (รันผ่าน Docker Container สำหรับสภาพแวดล้อมใช้งานจริง) และ SQLite (สำหรับทดสอบภายนอก)

---

## 📂 โครงสร้าง Monorepo
* `/frontend` : โค้ดส่วนหน้าบ้าน (Next.js + Tailwind CSS) บนพอร์ต **`3000`**
* `/backend` : โค้ดส่วนหลังบ้าน จัดการ Database และการยืนยันตัวตน (FastAPI) บนพอร์ต **`8000`**
* `/ai` : โค้ดส่วนประมวลผลปัญญาประดิษฐ์ Gemini Vision & Chatbot AI (FastAPI + FastMCP) บนพอร์ต **`8001`**

---

## ⚙️ การตั้งค่าตัวแปรระบบ (.env)
ให้ทำการคัดลอกไฟล์ `.env.example` ที่โฟลเดอร์ Root ให้กลายเป็นไฟล์ `.env` จากนั้นกรอกข้อมูลดังต่อไปนี้:
```env
# 🐘 ข้อมูลเข้าสู่ระบบฐานข้อมูล PostgreSQL (ใช้โดย Docker)
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydatabase

# 🔑 ตั้งค่าคีย์ความปลอดภัยของ JWT Authentication
SECRET_KEY=ใส่คีย์ลับส่วนตัวตรงนี้
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 🤖 คีย์ผู้ให้บริการ AI และภายนอก
GEMINI_API_KEY=รหัสคีย์ความปลอดภัยGemini
SPOONACULAR_API_KEY=รหัสคีย์ความปลอดภัยSpoonacular
```

---

## 🚀 ขั้นตอนการติดตั้งและรันระบบบนเครื่อง Local

### 1. รัน Database และ Backend (ผ่าน Docker Compose)
ที่โฟลเดอร์ Root ของโปรเจกต์ ให้เปิด Terminal และรันคำสั่ง:
```bash
docker compose up --build -d
```
*(หมายเหตุ: ระบบหลังบ้านได้ทำ Volume Mount โฟลเดอร์ `/backend` ไว้ในคอนเทนเนอร์ ส่งผลให้เวลาแก้ไขไฟล์หลังบ้าน เซิร์ฟเวอร์ใน Docker จะทำการ Hot-Reload อัปเดตให้อัตโนมัติทันที)*

---

### 2. รัน AI Service (พอร์ต 8001)
เปรียบเสมือนเครื่องมือวิเคราะห์ภาพและแชตร่วมกับหน้าบ้าน 
1. เปิด Terminal ใหม่แล้วเข้าไปยังโฟลเดอร์ `/ai`:
   ```bash
   cd ai
   ```
2. ทำการติดตั้งไลบรารีที่จำเป็น (แนะนำให้สร้าง Virtual Environment ก่อน):
   ```bash
   pip install -r requirements.txt
   ```
3. สั่งรัน AI Service:
   ```bash
   python main.py
   ```

---

### 3. รันพัฒนาเว็บหน้าบ้าน Frontend (พอร์ต 3000)
1. เปิด Terminal ใหม่แล้วเข้าไปยังโฟลเดอร์ `/frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Node.js packages:
   ```bash
   npm install
   ```
3. สั่งเริ่มระบบ Next.js:
   ```bash
   npm run dev
   ```

เมื่อรันครบแล้ว สามารถเปิดเว็บไปที่ [http://localhost:3000](http://localhost:3000) เพื่อเริ่มต้นใช้งานแอปพลิเคชันได้ทันที!