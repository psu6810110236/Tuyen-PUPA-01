from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta, timezone
from models.nutrition import NutritionLog
import httpx
import os

SPOONACULAR_KEY = os.getenv("SPOONACULAR_API_KEY")

# 1. บันทึกมื้ออาหาร
async def log_meal(user_id: int, data: dict, db: Session) -> NutritionLog:
    db_log = NutritionLog(
        user_id=user_id,
        meal_type=data["meal_type"],
        food_name=data["food_name"],
        calories=data.get("calories", 0.0),
        protein=data.get("protein", 0.0),
        carb=data.get("carb", 0.0),
        fat=data.get("fat", 0.0),
        source=data.get("source", "manual")
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# 2. รวมพลังงานและสารอาหารวันนี้ + คำนวณความคืบหน้า (Progress) เทียบกับเป้าหมาย
async def get_today_summary(user_id: int, db: Session) -> dict:
    # หาช่วงเวลา 00:00 น. ถึง 23:59 น. ของวันปัจจุบัน (UTC)
    now = datetime.now(timezone.utc)
    start_of_day = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    end_of_day = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)

    logs = db.query(NutritionLog).filter(
        NutritionLog.user_id == user_id,
        NutritionLog.logged_at >= start_of_day,
        NutritionLog.logged_at <= end_of_day
    ).all()

    # สมมติตั้งเป้าหมายมาตรฐาน (Daily Goals) หรือดึงจากตาราง User Profile ของคุณได้ในอนาคต
    goals = {"calories": 2000.0, "protein": 150.0, "carb": 200.0, "fat": 65.0}

    summary = {"calories": 0.0, "protein": 0.0, "carb": 0.0, "fat": 0.0}
    for log in logs:
        summary["calories"] += log.calories
        summary["protein"] += log.protein
        summary["carb"] += log.carb
        summary["fat"] += log.fat

    # ทำตัวเลขเปอร์เซ็นต์ความคืบหน้าสำหรับทำ ProgressBar หน้าเว็บ
    progress = {
        "calories_pct": round((summary["calories"] / goals["calories"]) * 100, 1) if goals["calories"] else 0,
        "protein_pct": round((summary["protein"] / goals["protein"]) * 100, 1) if goals["protein"] else 0,
        "carb_pct": round((summary["carb"] / goals["carb"]) * 100, 1) if goals["carb"] else 0,
        "fat_pct": round((summary["fat"] / goals["fat"]) * 100, 1) if goals["fat"] else 0,
    }

    return {
        "date": now.date().isoformat(),
        "totals": summary,
        "goals": goals,
        "progress_percentage": progress,
        "meals_count": len(logs)
    }

# 3. ดึงข้อมูลย้อนหลังตามจำนวนวัน
async def get_history(user_id: int, days: int, db: Session) -> list:
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    logs = db.query(NutritionLog).filter(
        NutritionLog.user_id == user_id,
        NutritionLog.logged_at >= cutoff_date
    ).order_by(NutritionLog.logged_at.desc()).all()
    return logs

# 4. ลบรายการบันทึกผิด
async def delete_log(user_id: int, log_id: int, db: Session) -> bool:
    log_item = db.query(NutritionLog).filter(NutritionLog.id == log_id, NutritionLog.user_id == user_id).first()
    if not log_item:
        return False
    db.delete(log_item)
    db.commit()
    return True

# 5. ประมาณค่าสารอาหารจากชื่อเมนูทั่วไป (เรียกถามผ่าน Gemini AI Service โฮสต์ที่พอร์ต 8001)
async def estimate_calories(food_name: str) -> dict:
    url = "http://host.docker.internal:8001/ai/nutrition"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json={"food_name": food_name}, timeout=15.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "food_name": data.get("food_name", food_name),
                    "calories": float(data.get("calories", 0.0)),
                    "protein": float(data.get("protein", 0.0)),
                    "carb": float(data.get("carbs", 0.0)),
                    "fat": float(data.get("fat", 0.0)),
                    "note": data.get("summary", "วิเคราะห์คุณค่าโภชนาการโดย Gemini AI")
                }
        except Exception as e:
            print(f"⚠️ [Estimate Calories AI Fallback] ไม่สามารถเชื่อมต่อ AI Service ได้: {e}")
            
    # ค่าประมาณการเบื้องต้นหากติดต่อระบบ AI ไม่สำเร็จ
    return {
        "food_name": food_name, 
        "calories": 0.0, 
        "protein": 0.0, 
        "carb": 0.0, 
        "fat": 0.0, 
        "note": "ไม่สามารถประมาณค่าสารอาหารได้ชั่วคราว"
    }