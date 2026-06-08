# 🧠 Backend Gateway & AI Agent

- Framework: FastAPI
- ORM: SQLAlchemy (Connected to Supabase PostgreSQL)
- Server Protocol: FastMCP (Model Context Protocol)

## 🚀 วิธีเริ่มงานสำหรับ มด (AI) และ ภู (Backend)
1. สร้างไฟล์ `.env` ไว้ในโฟลเดอร์นี้เพื่อใส่รหัสผ่าน
2. ติดตั้งคลังแสงร่วมกัน: `pip install -r requirements.txt`
3. สั่งรันระบบทดสอบ: `uvicorn main:app --reload`

SmartFood AI — Backend README
Getting Started & Project Structure
Prerequisites (สิ่งที่ต้องเตรียม)
•	Python 3.10+
•	Docker & Docker Desktop  (สำหรับรัน PostgreSQL)
•	Git

Setup ขั้นตอนทั้งหมด
1. Clone Repository
git clone <URL_REPOSITORY>
cd <ชื่อโฟลเดอร์โปรเจกต์>

2. สร้าง Virtual Environment
Windows (PowerShell):
python -m venv venv
venv\Scripts\activate
macOS / Linux:
python3 -m venv venv
source venv/bin/activate

3. ติดตั้ง Dependencies
pip install --upgrade pip
pip install -r requirements.txt

4. ตั้งค่า .env
สร้างไฟล์ .env ที่ root โปรเจกต์ ใส่ค่าดังนี้:
DATABASE_URL=postgresql://postgres:password@localhost:5432/your_db_name
SECRET_KEY=super-secret-key-xyz-123456789
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
💡 เปลี่ยน your_db_name และ password ให้ตรงกับ Docker ของคุณ

5. รัน PostgreSQL (Docker)
เปิด Docker Desktop ก่อน แล้วรัน:
docker-compose up -d

6. Start FastAPI Server
cd backend
uvicorn main:app --reload

ทดสอบระบบ
URL	คำอธิบาย
http://127.0.0.1:8000/	หน้าแรก API
http://127.0.0.1:8000/docs	Swagger UI — ทดสอบ /auth/register และ login ได้เลย

โครงสร้างโฟลเดอร์
Path	หน้าที่
backend/main.py	App Entry Point
backend/routers/	API routes แยกตามโมดูล (auth, recipes ฯลฯ)
backend/mcp_servers/	MCP Server แต่ละตัว
backend/models/	SQLAlchemy Models
backend/database.py	PostgreSQL connection (Supabase)
.env	Environment variables — ห้าม commit ขึ้น Git

API Endpoints ทั้งหมด
Auth
•	POST /auth/register — สมัครสมาชิก
•	POST /auth/login — รับ JWT token
•	POST /auth/logout — blacklist token (optional)

User Profile
•	GET  /users/me — ดูข้อมูลตัวเอง
•	PUT  /users/me — แก้ชื่อ / รูป
•	PUT  /users/me/goals — ตั้งเป้า kcal/macro

 
ข้างล่างนี้ยังไม่ทำ
Inventory (วัตถุดิบ)
•	POST   /inventory/scan — ถ่ายรูป → Gemini Vision
•	POST   /inventory/manual — เพิ่มเองแบบ manual
•	GET    /inventory/ — ดูของทั้งหมด
•	PUT    /inventory/{id} — แก้ไข/ยืนยันผล
•	DELETE /inventory/{id} — ลบรายการ

Recipe
•	GET    /recipes/suggest — วัตถุดิบที่มี → Spoonacular แนะนำเมนู
•	GET    /recipes/{id} — รายละเอียด + วิธีทำ
•	POST   /recipes/saved — บันทึกเมนูโปรด
•	DELETE /recipes/saved/{id} — ลบเมนูโปรด

Nutrition Log
•	POST   /nutrition/log — บันทึกมื้ออาหาร
•	GET    /nutrition/today — kcal/macro วันนี้
•	GET    /nutrition/history — ย้อนหลัง 7/30 วัน
•	DELETE /nutrition/log/{id} — ลบรายการผิด

AI Agent
•	POST /agent/chat — รับ message → Gemini ตัดสินใจเรียก MCP

Tips ก่อนแชร์ให้ทีม
รันคำสั่งนี้ขณะที่ venv active อยู่ เพื่อ export library list:
pip freeze > requirements.txt
แชร์ README.md + requirements.txt ให้ทีมพร้อมกันได้เลย
