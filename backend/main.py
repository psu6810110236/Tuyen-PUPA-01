from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from urllib.parse import quote
from sqlalchemy.orm import Session
from database import get_db
from models.user import User  # ดึงโมเดล User มาใช้งาน
from models.inventory import InventoryItem  # ดึงโมเดล InventoryItem มาใช้งาน
from routers.auth import router as auth_router  # ดึง Router สำหรับ Authentication มาใช้งาน
from routers.inventory import router as inventory_router  # ดึง Router สำหรับ Inventory มาใช้งาน
from routers.recipe import router as recipe_router  # ดึง Router สำหรับ Recipe มาใช้งาน
from routers.nutrition import router as nutrition_router  # ดึง Router สำหรับ Nutrition มาใช้งาน
from routers.agent import router as agent_router  # ดึง Router สำหรับ AI Agent มาใช้งาน
import time

app = FastAPI() # (ใช้ app ตัวเดิมของคุณที่มีอยู่แล้วได้เลย)

app.include_router(auth_router)  # (สมมติว่า auth_router คือ Router ที่คุณสร้างใน auth.py)
app.include_router(inventory_router)  # (สมมติว่า inventory_router คือ Router ที่คุณสร้างใน inventory.py)
app.include_router(recipe_router)  # (สมมติว่า recipe_router คือ Router ที่คุณสร้างใน recipe.py)
app.include_router(nutrition_router)  # (สมมติว่า nutrition_router คือ Router ที่คุณสร้างใน nutrition.py)
app.include_router(agent_router)  # รวมเราเตอร์ของ AI Agent เข้าสู่ระบบหลัก

@app.middleware("http")
async def log_and_time_middleware(request: Request, call_next):
    # 1. จังหวะขาเข้า: บันทึกเวลาเริ่มต้นที่ Request วิ่งเข้ามาชนเซิร์ฟเวอร์
    start_time = time.time()
    
    # 2. ส่งไม้ต่อให้ระบบในเครื่องทำงาน (เช่น วิ่งไปคิวรี่เบส หรือเช็ก JWT ใน auth.py)
    response = await call_next(request)
    
    # 3. จังหวะขาออก: คำนวณเวลาหลังจากระบบทำงานเสร็จสิ้น
    process_time = time.time() - start_time
    
    # พ่น Log ออกมาที่หน้าจอ Terminal ของเราเพื่อเอาไว้ดีบั๊กตรวจสอบความเร็ว
    print(f"⏰ [Middleware LOG] มีคนเรียกพาธ: {request.url.path} | ใช้เวลาประมวลผลไป: {process_time:.4f} วินาที")
    
    # ส่ง Response กลับไปหาหน้าเว็บเบราว์เซอร์ของผู้ใช้
    return response
 
# ----------------------------------------------------
# 📋 1. อ่านข้อมูลผู้ใช้ "ทั้งหมด" ในฐานข้อมูล (ดึงออกมาเป็น List)
# ----------------------------------------------------
@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    # .query(User).all() จะไปดึงข้อมูลทุกแถวในตาราง users มาให้
    users = db.query(User).all()
    return users


# ----------------------------------------------------
# 🔍 2. อ่านข้อมูล "เฉพาะเจาะจง" โดยค้นหาจาก ID (ดึงมาแค่คนเดียว)
# ----------------------------------------------------
@app.get("/users/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    # .filter() ทำหน้าที่เหมือน WHERE ใน SQL เพื่อกรองข้อมูลตามเงื่อนไข
    # .first() คือเลือกตัวแรกที่เจอ (ถ้าไม่เจอจะคืนค่าเป็น None)
    user = db.query(User).filter(User.id == user_id).first()
    
    # ถ้าค้นหาในฐานข้อมูลแล้วไม่เจอ ID นี้ ให้พ่น Error 404 บอกฝั่งหน้าเว็บ
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบผู้ใช้งาน ID: {user_id}")
        
    return user


# ----------------------------------------------------
# 🏷️ 3. อ่านข้อมูลโดยใช้เงื่อนไขอื่น เช่น ค้นหาจาก Username
# ----------------------------------------------------
@app.get("/users/search/{username}")
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"ไม่พบผู้ใช้งานชื่อ: {username}")
    return user


# ----------------------------------------------------
# 🧪 4. หน้าเว็บสำหรับทดสอบส่งของขาดเข้า LINE (สำหรับ Manual Test)
# ----------------------------------------------------
@app.get("/test-line", response_class=HTMLResponse)
def test_line_page():
    mock_title = "ข้าวผัดอกไก่ (Chicken Fried Rice)"
    mock_missing = [
        {"name": "egg", "display": "🥚 Egg (ไข่ไก่)", "amount": 1, "unit": "piece"},
        {"name": "garlic", "display": "🧄 Garlic (กระเทียม)", "amount": 2, "unit": "cloves"},
        {"name": "rice", "display": "🍚 Rice (ข้าวสวย)", "amount": 150, "unit": "g"},
        {"name": "soy sauce", "display": "🧴 Soy Sauce (ซีอิ๊วขาว)", "amount": 1, "unit": "tablespoon"}
    ]
    
    text_lines = [f"🛒 รายการของต้องซื้อจาก Lotus's สำหรับทำ '{mock_title}':"]
    for i, ing in enumerate(mock_missing, 1):
        text_lines.append(f"{i}. {ing['name']} ({ing['amount']} {ing['unit']})")
        text_lines.append(f"   👉 https://www.lotuss.com/th/search/{quote(ing['name'])}?sort=relevance:DESC")
    share_text = "\n".join(text_lines)
    
    # Modern LINE Share format
    line_share_url = f"https://line.me/R/share?text={quote(share_text)}"
    
    # Generate HTML direct links dynamically
    links_html = ""
    for ing in mock_missing:
        target_url = f"https://www.lotuss.com/th/search/{quote(ing['name'])}?sort=relevance:DESC"
        links_html += f'<a href="{target_url}" class="direct-link" target="_blank">{ing["display"]}</a>\n'
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ทดสอบส่งรายการของขาดเข้า LINE</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {{
                --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                --glass-bg: rgba(255, 255, 255, 0.03);
                --glass-border: rgba(255, 255, 255, 0.08);
                --line-color: #06C755;
                --line-hover: #05B34C;
                --text-primary: #f8fafc;
                --text-secondary: #94a3b8;
                --accent: #38bdf8;
            }}
            
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }}
            
            body {{
                font-family: 'Outfit', 'Sarabun', sans-serif;
                background: var(--bg-gradient);
                color: var(--text-primary);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                overflow-x: hidden;
            }}
            
            .container {{
                background: var(--glass-bg);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                padding: 30px 24px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                text-align: center;
                position: relative;
            }}
            
            .container::before {{
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(135deg, var(--accent), transparent, var(--line-color));
                border-radius: 26px;
                z-index: -1;
                opacity: 0.15;
            }}
            
            h1 {{
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 12px;
                background: linear-gradient(to right, #ffffff, var(--accent));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            
            .subtitle {{
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 24px;
                line-height: 1.5;
            }}
            
            .section-title {{
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--accent);
                margin-bottom: 10px;
                font-weight: 600;
                text-align: left;
            }}
            
            .links-list {{
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 24px;
            }}
            
            .direct-link {{
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 14px 20px;
                border-radius: 12px;
                color: #e2e8f0;
                text-decoration: none;
                font-size: 14px;
                font-weight: 600;
                text-align: left;
                transition: all 0.2s ease;
            }}
            
            .direct-link:hover {{
                background: rgba(255, 255, 255, 0.08);
                border-color: var(--accent);
                transform: translateX(4px);
                color: #ffffff;
            }}
            
            .preview-box {{
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 15px;
                text-align: left;
                font-size: 13px;
                line-height: 1.5;
                margin-bottom: 20px;
                white-space: pre-wrap;
                word-break: break-word;
                color: #cbd5e1;
                max-height: 150px;
                overflow-y: auto;
            }}
            
            .share-btn {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background-color: var(--line-color);
                color: white;
                text-decoration: none;
                font-size: 15px;
                font-weight: 700;
                padding: 14px 28px;
                border-radius: 50px;
                border: none;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 20px rgba(6, 199, 85, 0.3);
                width: 100%;
            }}
            
            .share-btn:hover {{
                background-color: var(--line-hover);
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(6, 199, 85, 0.4);
            }}
            
            .share-btn:active {{
                transform: translateY(1px);
            }}
            
            .share-btn svg {{
                width: 20px;
                height: 20px;
                margin-right: 10px;
                fill: currentColor;
            }}
            
            .footer {{
                margin-top: 24px;
                font-size: 11px;
                color: var(--text-secondary);
            }}
            
            .footer a {{
                color: var(--accent);
                text-decoration: none;
            }}
            
            .footer a:hover {{
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Lotus's Search Links</h1>
            <p class="subtitle">ทดสอบลิงก์ค้นหาสินค้าของ Lotus's ในรูปแบบใหม่ โดยคลิกตรงจากหน้านี้ หรือส่งแชร์เข้าแอป LINE</p>
            
            <div class="section-title">🔗 คลิกตรงเพื่อค้นหาสินค้าบนเบราว์เซอร์</div>
            <div class="links-list">
                {links_html}
            </div>
            
            <div class="section-title">💬 ส่งรายการของเข้า LINE</div>
            <div class="preview-box">{share_text}</div>
            
            <a href="{line_share_url}" class="share-btn" target="_blank">
                <svg viewBox="0 0 24 24">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.564.39.084.922.258 1.057.592.12.303.079.778.039 1.085l-.171 1.027c-.053.303-.245 1.185 1.059.646 1.302-.538 7.02-4.133 9.577-7.076 1.96-2.228 3.402-4.66 3.402-7.838zm-14.739 3.51c0 .414-.336.75-.75.75h-2.617c-.414 0-.75-.336-.75-.75v-5.024c0-.414.336-.75.75-.75s.75.336.75.75v3.524h1.867c.414 0 .75.336.75.75zm2.25 0c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-5.024c0-.414.336-.75.75-.75s.75.336.75.75v5.024zm4.275 0c0 .356-.25.669-.604.735-.049.01-.099.015-.146.015-.312 0-.598-.194-.698-.497l-1.895-3.834v3.581c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-5.024c0-.355.249-.668.603-.735.049-.009.099-.015.147-.015.312 0 .598.194.698.497l1.895 3.834v-3.581c0-.414.336-.75.75-.75s.75.336.75.75v5.024zm3.837-1.5c0 .414-.336.75-.75.75h-2.25c-.414 0-.75-.336-.75-.75v-5.024c0-.414.336-.75.75-.75h2.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.5v1.012h1.5c.414 0 .75.336.75.75s-.336.75-.75.75h-1.5v1.012h1.5c.414 0 .75.336.75.75z"/>
                </svg>
                แชร์รายการของเข้า LINE
            </a>
            
            <div class="footer">
                พัฒนาโดยทีม DevOps & AI | IP เครื่องเซิร์ฟเวอร์: <a href="http://192.168.1.152:8000/test-line">192.168.1.152</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)