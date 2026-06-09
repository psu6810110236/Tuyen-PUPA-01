import os
import sys

# 💡 ทริคเด็ดสำหรับ Windows: บังคับให้ Python รู้จักโฟลเดอร์ backend เสมอ ไม่ว่าจะสั่งรันจากมุมไหนของโลก
current_dir = os.path.dirname(os.path.abspath(__file__)) # อยู่ที่โฟลเดอร์ mcp_servers
backend_dir = os.path.dirname(current_dir)             # ถอยกลับมาที่โฟลเดอร์ backend

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# ----------------------------------------------------------------------
# 🎯 ตอนนี้ระบบจะ Import ได้แบบปลอดภัย ไร้เออเร่อ ModuleNotFoundError แล้วครับ
from mcp.server.fastmcp import FastMCP
import services.recipe_service as recipe_service

# สร้างเซิร์ฟเวอร์ MCP สำหรับให้ AI มาหยิบเครื่องมือ
mcp = FastMCP("SmartFood AI Recipe Manager")

# 📋 เครื่องมือชิ้นที่ 1: แนะนำเมนูอาหารจากวัตถุดิบ (ส่งให้ AI อ่าน)
@mcp.tool()
async def suggest_recipes_tool(ingredients: list[str]) -> list[dict]:
    """
    Suggests delicious recipes that can be cooked based on a provided list of ingredient names.
    Use this tool when the user wants to find out what meals they can make with their available ingredients.
    """
    # เพื่อป้องกันปัญหาภาษาไทย ให้เปลี่ยนมาดึงข้อมูลผ่าน Service ตรงๆ
    return await recipe_service.suggest_recipes(ingredients)

# 🔍 เครื่องมือชิ้นที่ 2: ค้นหาชื่อเมนูตรงๆ
@mcp.tool()
async def search_recipe_tool(name: str) -> list[dict]:
    """
    Search for recipes by their name.
    Use this tool when the user specifically mentions a dish name and wants to look it up.
    """
    return await recipe_service.search_recipe_by_name(name)

# 🔎 เครื่องมือชิ้นที่ 3: ดูวิธีทำอาหารละเอียด
@mcp.tool()
async def get_recipe_detail_tool(recipe_id: int) -> dict:
    """
    Get detailed instructions, preparation time, and servings for a specific recipe ID.
    Use this tool when the user selects a recipe and wants to see how to cook it step-by-step.
    """
    return await recipe_service.get_recipe_detail(recipe_id)

if __name__ == "__main__":
    mcp.run()

