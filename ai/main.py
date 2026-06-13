import base64
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from ai_services.gemini_service import analyze_food_image, chat_with_gemini
from ai_services.grocery_detection_service import detect_and_add_to_fridge
from ai_services.nutrition_service import (
    analyze_nutrition,
    analyze_nutrition_from_image,
)
from ai_services.integration import (
    get_fridge_items,
    get_recipe_suggestions,
    get_recipe_detail,
)

app = FastAPI(title="SmartFood AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---
class ScanRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class ScanAndAddRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []


class NutritionRequest(BaseModel):
    food_name: str


class NutritionImageRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class RecipeNutritionRequest(BaseModel):
    recipe_id: int


# --- Vision Endpoints ---


@app.post("/ai/scan")
async def scan_food(payload: ScanRequest):
    """
    วิเคราะห์รูปภาพอาหาร → คืน list วัตถุดิบ
    """
    image_bytes = base64.b64decode(payload.image_base64)
    ingredients = await analyze_food_image(image_bytes, payload.mime_type)
    return {"ingredients": ingredients}


@app.post("/ai/scan-and-add")
async def scan_and_add(
    payload: ScanAndAddRequest, authorization: Optional[str] = Header(None)
):
    """
    วิเคราะห์รูปภาพ → เพิ่มวัตถุดิบเข้าตู้เย็นอัตโนมัติ
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="กรุณาล็อกอินก่อน")

    token = authorization.replace("Bearer ", "")
    image_bytes = base64.b64decode(payload.image_base64)
    result = await detect_and_add_to_fridge(image_bytes, payload.mime_type, token)
    return result


# --- Chat Endpoint ---


@app.post("/ai/chat")
async def chat(payload: ChatRequest):
    """
    แชทกับ Gemini AI เรื่องอาหารและโภชนาการ
    """
    reply = await chat_with_gemini(payload.message, payload.history)
    return {"reply": reply}


# --- Nutrition Endpoints ---


@app.post("/ai/nutrition")
async def analyze_nutrition_endpoint(payload: NutritionRequest):
    """
    วิเคราะห์แคลอรี่จากชื่ออาหาร
    """
    result = await analyze_nutrition(payload.food_name)
    return result


@app.post("/ai/nutrition/image")
async def analyze_nutrition_image_endpoint(payload: NutritionImageRequest):
    """
    วิเคราะห์แคลอรี่จากรูปภาพอาหาร
    """
    image_bytes = base64.b64decode(payload.image_base64)
    result = await analyze_nutrition_from_image(image_bytes, payload.mime_type)
    return result


@app.post("/ai/nutrition/recipe")
async def analyze_nutrition_from_recipe(
    payload: RecipeNutritionRequest, authorization: Optional[str] = Header(None)
):
    """
    รับ recipe_id จากภู → วิเคราะห์แคลอรี่
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="กรุณาล็อกอินก่อน")

    token = authorization.replace("Bearer ", "")
    recipe = await get_recipe_detail(payload.recipe_id, token)

    if not recipe:
        raise HTTPException(status_code=404, detail="ไม่พบสูตรอาหาร")

    title = recipe.get("title", "")
    ingredients = recipe.get("extendedIngredients", [])
    ingredients_text = ", ".join([ing.get("name", "") for ing in ingredients])
    food_description = f"{title} ประกอบด้วย {ingredients_text}"

    result = await analyze_nutrition(food_description)
    return result


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SmartFood AI"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
