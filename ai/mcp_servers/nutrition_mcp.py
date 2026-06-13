import sys
import os
import base64

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.server.fastmcp import FastMCP
from ai_services.nutrition_service import (
    analyze_nutrition,
    analyze_nutrition_from_image,
)

mcp = FastMCP("SmartFood Nutrition AI")


@mcp.tool()
async def analyze_nutrition_tool(food_name: str) -> dict:
    """
    วิเคราะห์แคลอรี่และสารอาหารจากชื่ออาหาร
    เช่น "ข้าวผัดไก่", "ส้มตำ", "pad thai"
    """
    return await analyze_nutrition(food_name)


@mcp.tool()
async def analyze_nutrition_from_image_tool(
    image_base64: str, mime_type: str = "image/jpeg"
) -> dict:
    """
    วิเคราะห์แคลอรี่และสารอาหารจากรูปภาพอาหาร
    รับรูปแบบ base64 string
    """
    image_bytes = base64.b64decode(image_base64)
    return await analyze_nutrition_from_image(image_bytes, mime_type)


if __name__ == "__main__":
    mcp.run()
