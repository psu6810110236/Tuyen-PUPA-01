import os
import sys

# 💡 ทริคเด็ดสำหรับ Windows: ดึงพาธของโฟลเดอร์ย่อยเข้าสู่ระบบสากลของไฟล์นี้
# มันจะหาโฟลเดอร์ปัจจุบันที่ไฟล์นี้อยู่ แล้วถอยหลังกลับไปหาโฟลเดอร์หลักให้อัตโนมัติ
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir) # จะได้พาธของโฟลเดอร์ backend

if parent_dir not in sys.path:
    sys.path.append(parent_dir)
if current_dir not in sys.path:
    sys.path.append(current_dir)

# -------------------------------------------------------------
# 🎯 คราวนี้สั่ง Import แบบคลีนๆ ดั้งเดิมตามสเปกสถาปัตยกรรมของคุณได้เลยครับ:
from mcp.server.fastmcp import FastMCP
import services.recipe_service as recipe_service


mcp = FastMCP("SmartFood AI Recipe Manager")

@mcp.tool()
async def suggest_recipes_tool(ingredients: list[str]) -> list[dict]:
    """
    Suggests delicious recipes that can be cooked based on a provided list of ingredient names.
    Use this tool when the user wants to find out what meals they can make with their available ingredients.
    
    Args:
        ingredients: A list of string names of available ingredients (e.g., ['egg', 'pork', 'garlic']).
    """
    return await recipe_service.suggest_recipes(ingredients)

@mcp.tool()
async def get_recipe_detail_tool(recipe_id: int) -> dict:
    """
    Retrieves detailed preparation steps, cooking instructions, active time, and portion sizes 
    for a specific recipe using its unique ID. Use this when the user selects a specific dish to cook.
    
    Args:
        recipe_id: The unique integer identifier of the target Spoonacular recipe.
    """
    return await recipe_service.get_recipe_detail(recipe_id)

@mcp.tool()
async def search_recipe_tool(name: str) -> list[dict]:
    """
    Searches for global food recipes based on a generic textual query name or keyword.
    Use this tool when the user explicitly searches for a specific dish name like 'Tom Yum' or 'Pasta'.
    
    Args:
        name: The name or part of the name of the recipe to search for.
    """
    return await recipe_service.search_recipe_by_name(name)