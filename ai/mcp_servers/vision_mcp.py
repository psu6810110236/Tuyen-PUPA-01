import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.server.fastmcp import FastMCP
from ai_services.gemini_service import analyze_food_image, chat_with_gemini
from ai_services.grocery_detection_service import detect_and_add_to_fridge
from ai_services.integration import (
    get_fridge_items,
    get_recipe_suggestions,
    check_missing_ingredients,
)

mcp = FastMCP("SmartFood Vision AI")


@mcp.tool()
async def scan_food_image_tool(
    image_base64: str, mime_type: str = "image/jpeg"
) -> list[str]:
    """
    วิเคราะห์รูปภาพอาหารด้วย Gemini Vision
    รับรูปแบบ base64 string → คืน list ชื่อวัตถุดิบที่พบ
    ใช้แทน YOLO
    """
    import base64

    image_bytes = base64.b64decode(image_base64)
    return await analyze_food_image(image_bytes, mime_type)


@mcp.tool()
async def scan_and_add_to_fridge_tool(
    image_base64: str, token: str, mime_type: str = "image/jpeg"
) -> dict:
    """
    วิเคราะห์รูปภาพ → เพิ่มวัตถุดิบที่พบเข้าตู้เย็นของ user อัตโนมัติ
    """
    import base64

    image_bytes = base64.b64decode(image_base64)
    return await detect_and_add_to_fridge(image_bytes, mime_type, token)


@mcp.tool()
async def get_fridge_items_tool(token: str) -> list:
    """
    ดึงรายการวัตถุดิบทั้งหมดในตู้เย็นของ user
    """
    return await get_fridge_items(token)


@mcp.tool()
async def get_recipe_suggestions_tool(token: str) -> list:
    """
    ขอเมนูแนะนำตามวัตถุดิบในตู้เย็น
    """
    return await get_recipe_suggestions(token)


@mcp.tool()
async def check_missing_ingredients_tool(token: str, recipe_id: int) -> dict:
    """
    เช็กวัตถุดิบที่ขาดสำหรับเมนูที่เลือก พร้อมลิงก์ Lotus's
    """
    return await check_missing_ingredients(token, recipe_id)


@mcp.tool()
async def ask_food_ai_tool(message: str, history: list = []) -> str:
    """
    ถามคำถามเรื่องอาหารและโภชนาการกับ Gemini 2.5 Flash
    """
    return await chat_with_gemini(message, history)


if __name__ == "__main__":
    mcp.run()
