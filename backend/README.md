# 🧠 SmartFood AI - Backend System

ระบบเซิร์ฟเวอร์หลักสำหรับประมวลผลข้อมูลและเชื่อมต่อกับเอเจนต์ AI 

## 🚀 วิธีเริ่มงานสำหรับ มด (AI) และ ภู (Backend)

### Prerequisites (สิ่งที่ต้องเตรียม)
* Python 3.10+
* Docker & Docker Desktop (สำหรับรัน PostgreSQL)
* Git

### Setup ขั้นตอนทั้งหมด

**1. Clone Repository**
```bash
git clone <URL_REPOSITORY>
cd <ชื่อโฟลเดอร์โปรเจกต์>
```

**2. สร้าง Virtual Environment**
- Windows (PowerShell):
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
- macOS / Linux:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

**3. ติดตั้ง Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**4. ตั้งค่า .env**
สร้างไฟล์ `.env` ที่ root โปรเจกต์ (ก๊อปปี้จาก `.env.example`) โดยระบุค่าสำหรับเครื่อง Local ดังนี้:
```env
DATABASE_URL=postgresql+psycopg2://myuser:mypassword@localhost:5432/mydatabase
SECRET_KEY=super-secret-key-xyz-123456789
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### AI Agent Endpoints (เพิ่มเติม)
* `POST /agent/chat` — รับ message → Gemini ตัดสินใจเรียก MCP

> [!TIP]
> **Tips ก่อนแชร์ให้ทีม:** รันคำสั่งนี้ขณะที่ `venv` กำลัง active อยู่ เพื่อส่งออกรายการไลบรารี:
> ```bash
> pip freeze > requirements.txt
> ```

---

## ⚙️ เทคโนโลยีที่ใช้

*   **Framework:** FastAPI
*   **Database ORM:** SQLAlchemy
*   **Database Engine:** PostgreSQL (รันผ่าน Docker Container)
*   **AI Integration:** FastMCP สำหรับเชื่อมต่อกับ Gemini 2.5 Flash

## 🛠️ การตั้งค่าสภาพแวดล้อม

1. ตรวจสอบให้แน่ใจว่าติดตั้ง Python 3.10 ขึ้นไป
2. ติดตั้งแพ็กเกจที่จำเป็นทั้งหมดด้วยคำสั่ง: `pip install -r requirements.txt`
3. ตั้งค่าไฟล์ตัวแปรระบบตาม `.env.example` ที่หน้าแรกสุดของโปรเจค 
   **สำคัญ:** สำหรับการรันฐานข้อมูลในเครื่อง Local ให้ใช้ลิงก์นี้
   `DATABASE_URL=postgresql+psycopg2://myuser:mypassword@localhost:5432/mydatabase`

## 🚀 การรันเซิร์ฟเวอร์แบบแมนนวล (ไม่ผ่าน Docker Compose)

1. ตรวจสอบว่าได้รันฐานข้อมูล (PostgreSQL) ไว้แล้ว (เช่น รันเฉพาะคอนเทนเนอร์ `postgres_db` ของ Docker)
2. เข้าไปยังโฟลเดอร์ `backend` เสมอ:
   ```bash
   cd backend
   ```
3. รันคำสั่งเริ่มทำงานของเซิร์ฟเวอร์:
   ```bash
   uvicorn main:app --reload
   ```
   เซิร์ฟเวอร์จะเริ่มทำงานที่พอร์ต 8000

