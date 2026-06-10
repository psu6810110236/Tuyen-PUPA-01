import os
import sys
from urllib.parse import quote

# 💡 ทริคเด็ดสำหรับ Windows: บังคับให้ Python รู้จักโฟลเดอร์ backend เสมอ ไม่ว่าจะสั่งรันจากมุมไหนของโลก
current_dir = os.path.dirname(os.path.abspath(__file__)) # อยู่ที่โฟลเดอร์ mcp_servers
backend_dir = os.path.dirname(current_dir)             # ถอยกลับมาที่โฟลเดอร์ backend

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# ----------------------------------------------------------------------
# 🎯 ตอนนี้ระบบจะ Import ได้แบบปลอดภัย ไร้เออเร่อ ModuleNotFoundError แล้วครับ
from mcp.server.fastmcp import FastMCP
import services.recipe_service as recipe_service
from database import SessionLocal
from models.inventory import InventoryItem

# สร้างเซิร์ฟเวอร์ MCP สำหรับให้ AI มาหยิบเครื่องมือ
mcp = FastMCP("SmartFood AI Recipe Manager")

# 📋 เครื่องมือชิ้นที่ 1: แนะนำเมนูอาหารจากวัตถุดิบ (ส่งให้ AI อ่าน)
@mcp.tool()
async def suggest_recipes_tool(ingredients: list[str]) -> list[dict]:
    """
    Suggests delicious recipes that can be cooked based on a provided list of ingredient names.
    Use this tool when the user wants to find out what meals they can make with their available ingredients.
    """
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

# 🛒 เครื่องมือชิ้นที่ 4: คำนวณวัตถุดิบที่ขาด และสร้างลิงก์สั่งซื้อจาก Lotus's
@mcp.tool()
async def check_missing_ingredients_tool(user_id: int, recipe_id: int) -> dict:
    """
    Compares the user's inventory (refrigerator items) against the required ingredients of a recipe.
    Identifies which ingredients are missing, and generates Lotus's search URLs for those missing items
    to facilitate easy ordering.
    """
    # 1. ดึงรายละเอียดสูตรอาหาร
    try:
        recipe = await recipe_service.get_recipe_detail(recipe_id)
    except Exception as e:
        return {"error": f"Failed to retrieve recipe: {str(e)}"}
        
    recipe_ingredients = recipe.get("extendedIngredients", [])
    
    # 2. ดึงของในตู้เย็นของผู้ใช้
    db = SessionLocal()
    try:
        inventory_items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    except Exception as e:
        db.close()
        return {"error": f"Database error: {str(e)}"}
        
    # ดึงชื่อของที่มีในตู้เย็น (แปลงเป็นตัวเล็กเพื่อเปรียบเทียบง่าย)
    user_inv_names = [item.name.lower() for item in inventory_items]
    
    available = []
    missing = []
    
    # แปลงคำอ่านภาษาไทยเบื้องต้นเพื่อแมตช์วัตถุดิบกับตู้เย็นภาษาไทย
    thai_translations = {
        "egg": ["ไข่", "ไข่ไก่", "ไข่เป็ด"],
        "chicken": ["ไก่", "อกไก่", "เนื้อไก่"],
        "pork": ["หมู", "หมูสับ", "เนื้อหมู"],
        "garlic": ["กระเทียม"],
        "onion": ["หอมใหญ่", "หัวหอม"],
        "cabbage": ["กะหล่ำปลี", "ผักกาด"],
        "rice": ["ข้าว", "ข้าวสวย", "ข้าวสาร"],
    }
    
    # 3. ตรวจสอบวัตถุดิบทีละตัว
    for ing in recipe_ingredients:
        ing_name = ing["name"]
        found = False
        
        # ค้นหาแบบจับคู่ชื่อตรงๆ
        for inv_name in user_inv_names:
            if ing_name.lower() in inv_name or inv_name in ing_name.lower():
                found = True
                break
                
        # ค้นหาผ่านตารางคำแปลภาษาไทยเพิ่มเติม
        if not found:
            base_name = ing_name.lower()
            for eng_key, translation_list in thai_translations.items():
                if eng_key in base_name:
                    for translation in translation_list:
                        for inv_name in user_inv_names:
                            if translation in inv_name:
                                found = True
                                break
                        if found:
                            break
                if found:
                    break
                    
        ing_info = {
            "name": ing_name,
            "amount": ing.get("amount"),
            "unit": ing.get("unit")
        }
        
        if found:
            available.append(ing_info)
        else:
            # สร้างลิงก์ค้นหาบน Lotus's ภาษาอังกฤษ (เพราะเว็บ Lotus's รองรับคำค้นหาภาษาอังกฤษด้วย)
            encoded_query = quote(ing_name)
            ing_info["lotus_search_url"] = f"https://www.lotuss.com/th/search?q={encoded_query}"
            missing.append(ing_info)
            
    db.close()
    
    return {
        "recipe_title": recipe.get("title"),
        "available_ingredients": available,
        "missing_ingredients": missing,
        "shopping_list_ready": len(missing) > 0
    }

if __name__ == "__main__":
    mcp.run()
