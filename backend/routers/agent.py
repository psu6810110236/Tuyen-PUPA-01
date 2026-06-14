import os
import asyncio
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from database import get_db, SessionLocal
from routers.auth import get_current_user
from models.user import User
from models.inventory import InventoryItem
import services.recipe_service as recipe_service

router = APIRouter(prefix="/agent", tags=["AI Agent"])

# --- Pydantic Validation Schemas ---
class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

# --- Helper for Gemini Client ---
def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY ยังไม่ได้กำหนดค่าที่ถูกต้องในไฟล์ระบบ .env"
        )
    return genai.Client(api_key=api_key)

# --- Endpoint ---
@router.post("/chat")
async def chat_with_agent(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    ห้องแชทอัจฉริยะคุยกับ Gemini 3.1 Flash โดยเชื่อมโยงกับตู้เย็นจริงของผู้ใช้งานผ่านฐานข้อมูล
    """
    client = get_gemini_client()
    user_id = current_user.id

    # 🛠️ 1. สร้างเครื่องมือ (Tools) ครอบ Closure ของ User ID เพื่อความปลอดภัย
    def suggest_recipes_from_fridge() -> list:
        """
        Suggests delicious recipes based on the ingredients currently available in the user's refrigerator.
        Call this tool when the user wants menu recommendations from their fridge.
        """
        db = SessionLocal()
        try:
            user_items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
            ingredients = [item.name for item in user_items]
            if not ingredients:
                return [{"message": "ตู้เย็นว่างเปล่า กรุณาเพิ่มของก่อน"}]
            # รัน async function ใน sync context
            return asyncio.run(recipe_service.suggest_recipes(ingredients))
        finally:
            db.close()

    def search_recipe_by_name(name: str) -> list:
        """
        Search for recipes by their name.
        Call this tool when the user specifically mentions a dish name they want to cook.
        """
        return asyncio.run(recipe_service.search_recipe_by_name(name))

    def get_recipe_detail(recipe_id: int) -> dict:
        """
        Get detailed instructions, preparation time, servings, and ingredients list for a specific recipe ID.
        Call this tool when the user wants to see how to cook a specific recipe.
        """
        return asyncio.run(recipe_service.get_recipe_detail(recipe_id))

    def check_missing_ingredients_and_get_links(recipe_id: int) -> dict:
        """
        Compares the user's refrigerator items against the required ingredients of a recipe.
        Identifies which ingredients are missing, and generates Lotus's search URLs and LINE share link.
        Call this tool when the user wants to cook a specific recipe and needs to know what is missing.
        """
        db = SessionLocal()
        try:
            return asyncio.run(recipe_service.check_recipe_inventory(user_id, recipe_id, db))
        finally:
            db.close()

    # 🛠️ 2. จัดรูปแบบข้อความสำหรับการส่งไปหา Gemini SDK
    # SDK ตัวใหม่รับโมเดลแชทประวัติผ่านรูปแบบประเภท Content
    gemini_contents = []
    for msg in payload.messages:
        # ปรับบทบาทให้ตรงกับข้อกำหนด SDK
        role = "user" if msg.role == "user" else "model"
        gemini_contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.content)]
            )
        )

    try:
        # 🛠️ 3. เรียกใช้งาน Gemini พร้อมติดตั้ง Tools และเปิดระบบ Auto Tool Calling
        # โมเดลแนะนำหลักคือ gemini-3.1-flash-lite
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
        
        response = client.models.generate_content(
            model=model_name,
            contents=gemini_contents,
            config=types.GenerateContentConfig(
                tools=[
                    suggest_recipes_from_fridge,
                    search_recipe_by_name,
                    get_recipe_detail,
                    check_missing_ingredients_and_get_links
                ],
                temperature=0.7,
                system_instruction=(
                    "คุณคือ 'SmartFood AI' ผู้ช่วยโภชนาการและการจัดเตรียมอาหารอัจฉริยะของทีม PUPA "
                    "มีเป้าหมายในการแนะนำสูตรอาหารจากตู้เย็นของผู้ใช้ และช่วยแนะนำการสั่งวัตถุดิบที่ขาดผ่าน Lotus's "
                    "ให้ตอบคำถามเป็นภาษาไทยอย่างเป็นกันเองและสุภาพเสมอ "
                    "เมื่อผู้ใช้ต้องการประเมินของขาดหรืออยากเริ่มทำอาหาร ให้เรียกใช้เครื่องมือ "
                    "และสรุปรายการของที่ต้องซื้อพร้อมแนบลิงก์ Lotus's และ LINE Share กลับมาให้ครบถ้วน"
                )
            )
        )
        
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการประมวลผลคำสั่ง AI: {str(e)}"
        )
