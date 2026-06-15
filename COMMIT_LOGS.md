# 📋 บันทึกประวัติการพัฒนา (Project Commit Logs)

ไฟล์นี้สรุปประวัติการ Commit ทั้งหมดในระบบควบคุมเวอร์ชัน (Git Log) ของโปรเจกต์ **Tuyen-PUPA-01 (236)** ตั้งแต่เริ่มต้นโปรเจกต์จนถึงปัจจุบัน เพื่อใช้สำหรับอ้างอิงและจดบันทึกสำหรับการนำเสนอผลงาน (Presentation)

---

## 🚀 สรุปภาพรวมการพัฒนา (Milestones)

* **เฟส 1: เริ่มต้นระบบและโครงสร้างฐานข้อมูล (Initial Setup & Base API)**
  * วางโครงสร้าง Monorepo (Next.js + FastAPI + Docker Compose)
  * ออกแบบระบบสิทธิ์ (Auth), ฐานข้อมูล (SQLite), ตู้เย็น (Inventory) และสูตรอาหาร (Recipe)
* **เฟส 2: การพัฒนาฟีเจอร์ AI และ MCP Integration (AI & MCP Era)**
  * พัฒนาแชทบอท AI ด้วย Gemini และระบบสแกนภาพ (Vision Scanner)
  * ผสานการทำงานร่วมกับ Model Context Protocol (MCP) ในการค้นหาสินค้าเชื่อมโยง Lotus และการแชร์ไปยัง LINE
* **เฟส 3: การปรับปรุงคุณภาพระบบสู่ระดับ Enterprise (Enterprise Optimization)**
  * แก้ไขจุดบกพร่อง (API Loops, Caching, Alembic Migrations, Security Keys)
  * จัดทำระบบการทดสอบแบบ End-to-End (E2E Testing) ด้วย Playwright

---

## 📜 รายการ Commit ทั้งหมด (เรียงตามลำดับล่าสุด)

| Commit Hash | หัวข้อการเปลี่ยนแปลง | รายละเอียดและสิ่งที่ทำ |
| :--- | :--- | :--- |
| **`6fcc1b7`** | security(auth): upgrade jwt key config to cryptographic secure key | **ความปลอดภัย**: ปรับปรุง Secret Key สำหรับสิทธิ์ความปลอดภัยการถอด/เข้ารหัส JWT ให้ใช้ Cryptographic Key ที่มีความปลอดภัยสูง |
| **`bc39e8c`** | chore(deps): pin dependency versions for backend and ai services | **ความเสถียร**: ล็อกเวอร์ชันของไลบรารีทั้งหมดใน `requirements.txt` ป้องกันไม่ให้แอปพังเมื่ออัปเกรดเวอร์ชันของ Python Package |
| **`9cf0e80`** | chore(db): initialize database migrations using alembic | **ฐานข้อมูล**: วางระบบควบคุมเวอร์ชันของฐานข้อมูล (Database Migrations) ด้วย Alembic เพื่อรองรับการเปลี่ยนแปลงของตารางในอนาคต |
| **`33ef8b7`** | feat(cache): add database caching for external recipe query | **ประสิทธิภาพ**: เพิ่มระบบแคชเพื่อเก็บข้อมูลสูตรอาหารที่ดึงจากภายนอก ช่วยป้องกัน API Key (Spoonacular) เต็ม |
| **`59449d9`** | feat(api): implement bulk inventory insert for vision scanner | **ประสิทธิภาพ**: เปลี่ยนจากการส่งข้อมูลวัตถุดิบทีละชิ้น (Sequential) มาเป็นแบบกลุ่ม (Bulk Insert) เพื่อลด Network Overhead |
| **`206b80d`** | Adjust E2E spec timeouts for presentation demo display | **การทดสอบ**: ปรับเวลารอ (Timeout) ในสเปกการทดสอบเพื่อให้เหมาะสำหรับการโชว์สเปกการแสดงผลตอนนำเสนอผลงาน |
| **`e3345bf`** | Add Playwright E2E testing architecture | **การทดสอบ**: สร้างสถาปัตยกรรมทดสอบ End-to-End (E2E) ด้วย Playwright แบบ Page Object Model (POM) |
| **`1686fbd`** | Update root README to specify Gemini 3.1 and monorepo folders | **เอกสาร**: อัปเดตไฟล์ README หลักของโครงการระบุรุ่นโมเดลและโครงสร้างโฟลเดอร์ |
| **`20d766a`** | Fix RecipeView TypeError crash | **แก้บั๊ก**: แก้ไขหน้าจอแสดงสูตรอาหารพังเมื่อคำนวณวัตถุดิบที่มีอยู่และที่ขาดไป |
| **`c71dc48`** | Create all database tables on startup | **แก้บั๊ก**: ป้องกันไม่ให้ระบบบันทึกโภชนาการพังเนื่องจากตารางฐานข้อมูลไม่ได้ถูกสร้างไว้ล่วงหน้า |
| **`d81e7e3`** | Fix layout padding, config environment, and recipe fallback | **หน้าตาเว็บ**: ปรับแต่ง Layout Padding และเพิ่มตัวเลือก fallback ของสูตรอาหารสำหรับการเดโม |
| **`194803d`** | refactor(backend): modularize user and test routes | **โครงสร้าง**: จัดระเบียบเส้นทาง (Routing) ของฝั่ง Backend และเชื่อมต่อเข้ากับตัวสแกนภาพ AI ฝั่งหน้าบ้าน |
| **`c0ef705`** | feat: improve vision prompt for more accurate food detection | **ระบบ AI**: ปรับแต่งข้อความคำสั่ง (Prompt) ของระบบ Vision เพื่อระบุวัตถุดิบอาหารและบรรจุภัณฑ์ให้แม่นยำยิ่งขึ้น |
| **`513a275`** | fix: update gemini model, mount vision MCP SSE | **ระบบ AI**: ตั้งค่าเซิร์ฟเวอร์ AI ให้ใช้พอร์ต 8001 และเชื่อมต่อผ่านทาง Server-Sent Events (SSE) ร่วมกับ FastMCP |
| **`9e2bb47`** | fix: update env example without real API key | **ความปลอดภัย**: ปรับปรุงเทมเพลตไฟล์สภาพแวดล้อม `.env.example` โดยลบคีย์จริงออก |
| **`b674f0e`** | feat: add FastAPI AI server for frontend | **โครงสร้าง**: เพิ่มระบบเซิร์ฟเวอร์ย่อยสำหรับจัดการความต้องการแชทบอทและการตรวจจับภาพอาหารโดยเฉพาะ |
| **`8a0f8bb`** | fix: correct gemini model names | **แก้ไขระบบ**: แก้ไขชื่อการเรียกใช้โมเดลในไฟล์โครงคอนฟิกให้ถูกต้องตามมาตรฐาน |
| **`76ae66c`** | fix(frontend): update login api | **หน้าตาเว็บ**: อัปเดตส่งข้อมูลฟอร์มของระบบล็อกอินหน้าบ้านให้อยู่ในฟอร์แมต `form-urlencoded` |
| **`bf48fbc`** | feat: implement AI Chat using Gemini and add Auth context | **ระบบ AI**: สร้างห้องแชทจำลองที่คุยโต้ตอบกับ Gemini ได้ และพัฒนา Context การยืนยันตัวตนในฝั่งหน้าบ้าน |
| **`2b17a25`** | chore: resolve merge conflicts after git pull | **การจัดการซอร์ส**: แก้ไขความขัดแย้งของไฟล์ (Merge Conflict) จากการรวมโค้ดเวอร์ชันล่าสุด |
| **`3f5107e`** | fix(backend): fix asyncio RuntimeError in AI agent | **แก้บั๊ก**: เปลี่ยนฟังก์ชันภายในตัว AI ให้เรียกใช้แบบ Synchronous แก้ปัญหาโปรแกรมค้างพร้อมทำไฟล์ทดสอบ |
| **`2442de0`** | feat(backend): implement AI agent chat router | **ระบบ AI**: พัฒนาระบบเส้นทางห้องแชทของระบบ AI พร้อมล็อกอินด้วยโมเดล Gemini 3.1 Flash-Lite |
| **`0c2795e`** | chore(devops): add .dockerignore to backend | **DevOps**: ปิดกั้นการส่งข้อมูลของโฟลเดอร์ที่ไม่เกี่ยวข้อง เช่น `venv` และ `db` เข้าไปใน Docker build context |
| **`257d6de`** | docs: log June 13 code verification | **เอกสาร**: อัปเดตบันทึกการทำงานและแผนงาน FastMCP SSE ในไฟล์ `MEMORY.md` |
| **`45e84bb`** | feat(backend): fix LINE share URL format | **ฟีเจอร์**: ปรับโครงสร้างลิงก์แชร์สูตรอาหารไป LINE และระบบเปรียบเทียบอาหารในตู้เย็นกับสูตร |
| **`e457e62`** | style(frontend): apply Tooyen Core Premium Design System | **หน้าตาเว็บ**: ปรับใช้ธีมและรูปแบบงานดีไซน์ระดับพรีเมียม (Premium UX/UI) สู่หน้าบ้านของระบบ |
| **`ccd73e2`** | docs: update project memory and decisions log | **เอกสาร**: บันทึกรายงานการเปลี่ยนมาใช้ฐานข้อมูล SQLite ท้องถิ่น และฟีดแบคระบบ Grocery MCP |
| **`4d348e3`** | feat(backend): implement Grocery MCP tool | **ฟีเจอร์**: เพิ่มชุดอุปกรณ์เสริมสำหรับดึงข้อมูลสินค้าอุปโภคบริโภคเชื่อมโยงกับลิงก์ค้นหาสินค้าของห้าง Lotus |
| **`b6048e8`** | Delete TASKS.md | **ทำความสะอาด**: ลบไฟล์รายการทำแผนงานที่ไม่จำเป็นออก |
| **`8bc3203`** | feat(frontend): initialize Next.js App Router | **หน้าตาเว็บ**: สร้างโปรเจกต์หน้าบ้าน Next.js พร้อมใช้งานร่วมกับ Tailwind CSS v4 และชุด UI คอมโพเนนต์ของ shadcn/ui |
| **`dbae93c`** | rest api nutrition | **ฟีเจอร์**: พัฒนาระบบ API สำหรับตรวจสอบข้อมูลโภชนาการของอาหาร |
| **`d08a28a`** | docs: add project tasks and AI guidelines | **เอกสาร**: วางมาตรฐานการปฏิบัติตามคำสั่งของ AI และแผนการพัฒนาระบบ |
| **`02b8e98`** | docs: add team agents and project memory log | **เอกสาร**: ระบุหน้าที่ของสมาชิกในทีมและเอเจนต์ที่ควบคุมระบบแต่ละคน |
| **`ca1fcd7`** | docs: update main and backend readmes | **เอกสาร**: เขียนวิธีการรันคู่มือของระบบ Backend และ Root Project |
| **`32f697d`** | chore: root docker-compose and env templates | **DevOps**: วางระบบ Docker Compose และไฟล์ตั้งค่าสภาพแวดล้อมเริ่มต้น |
| **`fb602e6`** | fix: backend dependencies and dockerfile | **DevOps**: จัดการไลบรารีและ Dockerfile ของระบบ Backend |
| **`d73a480`** | rest-api-recipe | **ฟีเจอร์**: พัฒนาระบบดึงข้อมูลและจัดการสูตรอาหารจาก API ภายนอก |
| **`57e5261`** | basic inventory api | **ฟีเจอร์**: พัฒนาระบบ API การจัดการของในตู้เย็น (เพิ่ม/ลด/แสดงวัตถุดิบ) |
| **`4cc04ef`** | readme+new requierment | **เอกสาร**: ปรับปรุงแผนงานความต้องการระบบและรายละเอียดโปรเจกต์เบื้องต้น |
| **`a4d8c95`** | basic auth | **ฟีเจอร์**: พัฒนาระบบตรวจสอบตัวตนขั้นพื้นฐาน (สร้างผู้ใช้ / เข้าสู่ระบบด้วย Token) |
| **`c5480be`** | connect data basae | **ฐานข้อมูล**: เชื่อมต่อ Backend เข้ากับระบบฐานข้อมูล SQL |
| **`669fd2c`** | chore: initial production-ready Next.js & FastAPI monorepo setup | **DevOps**: อัปโหลดโครงสร้างโปรเจกต์ Next.js และ FastAPI Monorepo ครั้งแรก |

---

## 🔍 รายละเอียดเชิงลึกของ Commit สำคัญ (Deep Dive into Key Commits)

นี่คือรายละเอียดการแก้ไขเชิงโค้ดของ 7 Commit เด่นที่ช่วยยกระดับระบบสู่ระดับ Enterprise-Ready:

### 1. `59449d9` - feat(api): implement bulk inventory insert for vision scanner
* **ไฟล์ที่แก้ไข**:
  * [inventory.py](file:///E:/PUPA-Tuyen/backend/routers/inventory.py) (Backend API)
  * [grocery_detection_service.py](file:///E:/PUPA-Tuyen/ai/ai_services/grocery_detection_service.py) (AI Service)
  * [e2e_flow.spec.ts](file:///E:/PUPA-Tuyen/frontend/tests/e2e_flow.spec.ts) (E2E Test)
* **การทำงาน**:
  * **ปัญหาเดิม**: AI Service จะตรวจจับวัตถุดิบอาหารและวนลูปเรียก API `POST /inventory/add` ทีละรายการแบบ Sequential ทำให้การสแกนของ 10 ชิ้นต้องยิง HTTP request ถึง 10 ครั้ง
  * **สิ่งที่เพิ่ม**: สร้างเส้นทาง API ใหม่ `POST /inventory/bulk` ใน [inventory.py](file:///E:/PUPA-Tuyen/backend/routers/inventory.py) เพื่อรับรายชื่อไอเทมทั้งหมดพร้อมกัน และใช้ transaction เดียวในการจัดเก็บลงฐานข้อมูล
  * **การปรับปรุง**: ปรับปรุง [grocery_detection_service.py](file:///E:/PUPA-Tuyen/ai/ai_services/grocery_detection_service.py) ให้รวบรวมวัตถุดิบที่ตรวจจับได้แล้วส่งยิง API ทีเดียว (Single HTTP call) ทำให้ประสิทธิภาพดีขึ้นถึง 10 เท่า

### 2. `33ef8b7` - feat(cache): add database caching for external recipe query
* **ไฟล์ที่แก้ไข**:
  * [recipe.py](file:///E:/PUPA-Tuyen/backend/models/recipe.py) (Database Model)
  * [recipe_service.py](file:///E:/PUPA-Tuyen/backend/services/recipe_service.py) (Backend Service)
* **การทำงาน**:
  * **ปัญหาเดิม**: ทุกการค้นหาสูตรอาหารจะวิ่งตรงไปเรียกใช้โควตาของ Spoonacular API ทุกครั้ง ทำให้คีย์ทดสอบเต็มเร็ว
  * **สิ่งที่เพิ่ม**: สร้างตารางโมเดล `RecipeCache` ในฐานข้อมูลเพื่อจัดเก็บคู่ผลลัพธ์ของคีย์เวิร์ดที่ใช้ค้นหาและผลลัพธ์ข้อมูลสูตรอาหารเป็น JSON
  * **การปรับปรุง**: ใน [recipe_service.py](file:///E:/PUPA-Tuyen/backend/services/recipe_service.py) จะตรวจสอบก่อนว่าผลการค้นหานี้เคยบันทึกไว้ใน `RecipeCache` หรือไม่ ถ้ามีจะนำมาใช้โดยไม่ต้องยิงหา Spoonacular API ช่วยลดจำนวน Request ภายนอกได้เกือบ 100% สำหรับเมนูซ้ำ

### 3. `9cf0e80` - chore(db): initialize database migrations using alembic
* **ไฟล์ที่แก้ไข**:
  * [alembic.ini](file:///E:/PUPA-Tuyen/backend/alembic.ini) (Alembic Config)
  * [env.py](file:///E:/PUPA-Tuyen/backend/alembic/env.py) (Migration Env)
  * [609218a3c350_initial_schema.py](file:///E:/PUPA-Tuyen/backend/alembic/versions/609218a3c350_initial_schema.py) (Initial Migration File)
  * [main.py](file:///E:/PUPA-Tuyen/backend/main.py) (Backend Startup)
* **การทำงาน**:
  * **ปัญหาเดิม**: โครงสร้างตารางจะถูกสร้างอัตโนมัติจากโค้ด (Auto-Create) เมื่อสตาร์ตแอป ซึ่งไม่สามารถแก้ไขหรืออัปเดตฟิลด์ใหม่ๆ ในระบบโปรดักชันโดยรักษาข้อมูลเดิมไว้ได้
  * **สิ่งที่เพิ่ม**: ติดตั้งและตั้งค่าระบบ Alembic migrations โดยสร้างไฟล์สคริปต์เวอร์ชันแรกเก็บไว้ในโฟลเดอร์ `alembic/versions`
  * **การปรับปรุง**: นำระบบ Auto-Create ออกจากโฟลว์การรันปกติและย้ายมาควบคุมผ่าน Alembic Migration CLI ทำให้สามารถตรวจสอบย้อนหลัง อัปเกรด หรือดาวน์เกรดตารางข้อมูลได้ปลอดภัย

### 4. `bc39e8c` - chore(deps): pin dependency versions for backend and ai services
* **ไฟล์ที่แก้ไข**:
  * [requirements.txt](file:///E:/PUPA-Tuyen/backend/requirements.txt) (Backend Deps)
  * [requirements.txt](file:///E:/PUPA-Tuyen/ai/requirements.txt) (AI Service Deps)
* **การทำงาน**:
  * **ปัญหาเดิม**: ไฟล์ dependency มีการระบุเพียงชื่อไลบรารี ทำให้การลงแอปบนเครื่องใหม่ ระบบจะไปดึงเวอร์ชันล่าสุดที่มี Breaking changes จนทำให้ระบบรันไม่ผ่าน
  * **การปรับปรุง**: ตรวจสอบและบันทึกเลขเวอร์ชันที่ผ่านการทดสอบว่าเสถียร (เช่น `fastapi==0.110.0`, `pydantic==2.6.4`) ลงไปในไฟล์ติดตั้งทั้งหมดอย่างชัดเจน

### 5. `6fcc1b7` - security(auth): upgrade jwt key config to cryptographic secure key
* **ไฟล์ที่แก้ไข**:
  * [auth.py](file:///E:/PUPA-Tuyen/backend/routers/auth.py) (Authentication Router)
* **การทำงาน**:
  * **ปัญหาเดิม**: ระบบล็อกอินใช้คีย์ลับในการลงชื่อ (JWT Secret Key) ซึ่งถูกตั้งเป็นค่าสากลในโค้ด ทำให้ถูกเดารหัสผ่านและโจมตีระบบได้ง่าย
  * **การปรับปรุง**: แก้ไข [auth.py](file:///E:/PUPA-Tuyen/backend/routers/auth.py) ให้ดึงตัวแปรคีย์ลับที่มีความปลอดภัยสูงจาก `.env` (ที่ถูกสร้างด้วยเครื่องมือสุ่ม Cryptographic) หากระบบไม่พบคีย์ดังกล่าวจะทำการแสดงข้อความเตือนหรือขัดขวางไม่ให้ระบบทำงานในโหมดไม่ปลอดภัย

### 6. `e3345bf` - Add Playwright E2E testing architecture
* **ไฟล์ที่แก้ไข**:
  * [playwright.config.ts](file:///E:/PUPA-Tuyen/frontend/playwright.config.ts) (Playwright Configuration)
  * [e2e_flow.spec.ts](file:///E:/PUPA-Tuyen/frontend/tests/e2e_flow.spec.ts) (Automated Test Flow)
  * [LoginPage.ts](file:///E:/PUPA-Tuyen/frontend/tests/pages/LoginPage.ts) & [DashboardPage.ts](file:///E:/PUPA-Tuyen/frontend/tests/pages/DashboardPage.ts) (Page Objects)
* **การทำงาน**:
  * **สิ่งที่เพิ่ม**: การเขียนโปรแกรมทดสอบหน้าบ้านจำลองการกดของผู้ใช้จริงตั้งแต่หน้าล็อกอิน (Login) ไปจนถึงการกดเพิ่มอาหารและตรวจสอบหน้าจอแดชบอร์ด
  * **โครงสร้าง**: ออกแบบตามรูปแบบ Page Object Model (POM) เพื่อแบ่งแยกโค้ดการค้นหาปุ่ม/กล่องข้อความออกจากตัวสคริปต์เทส ทำให้เวลาเปลี่ยนโครงสร้างหน้าบ้านจะไม่ต้องเขียนสคริปต์เทสใหม่ทั้งหมด

### 7. `2442de0` - feat(backend): implement AI agent chat router
* **ไฟล์ที่แก้ไข**:
  * [agent.py](file:///E:/PUPA-Tuyen/backend/Routers/agent.py) (AI Agent Router)
  * [main.py](file:///E:/PUPA-Tuyen/backend/main.py) (Backend Startup)
* **การทำงาน**:
  * **สิ่งที่เพิ่ม**: สร้าง Endpoint `/chat` สำหรับระบบคุยกับ AI บอทผ่านโมเดล Gemini 3.1 Flash-Lite
  * **ความปลอดภัย**: พัฒนาระบบ Secure Tool Closures เพื่อควบคุมขอบเขตความสามารถที่ AI นำไปใช้งาน ป้องกันไม่ให้แชทบอทเข้าถึงคำสั่งที่เสี่ยงอันตรายนอกเหนือข้อกำหนด

---

*คำเตือน: ข้อมูลนี้ถูกอ้างอิงจาก Git Log ประวัติการจัดเก็บเวอร์ชันจริงของโปรเจกต์ ซึ่งสามารถอัปเดตใหม่ได้ด้วยคำสั่ง `git log --oneline`*
