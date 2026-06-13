🤖 AI Module (SmartFood AI ) 

วิเคราะห์รูปภาพอาหาร/วัตถุดิบ (Vision) การวิเคราะห์โภชนาการ และการให้บริการผ่าน MCP (Model Context Protocol) เพื่อให้ Agent สามารถเรียกใช้งานเป็นเครื่องมือ (tools) ได้


📂 โครงสร้างโฟลเดอร์

ai/
├── ai_services/
│   ├── config.py                    # ค่า config กลาง (API Key, ชื่อโมเดล Gemini, Backend URL)
│   ├── gemini_service.py            # core service เรียก Gemini (chat + vision)
│   ├── grocery_detection_service.py # วิเคราะห์รูป → เพิ่มวัตถุดิบเข้าตู้เย็นผ่าน backend
│   ├── integration.py               # เรียก backend API (inventory, recipe, missing ingredients)
│   └── nutrition_service.py         # วิเคราะห์โภชนาการจากชื่ออาหาร / รูปภาพ
├── mcp_servers/
│   ├── nutrition_mcp.py             # MCP server: เครื่องมือวิเคราะห์โภชนาการ
│   └── vision_mcp.py                # MCP server: เครื่องมือวิเคราะห์รูปภาพ + ผูกกับตู้เย็น/สูตรอาหาร
├── requirements.txt
├── test_nutrition.py
├── test_recipe_nutrition.py
└── test_vision.py


⚙️ การตั้งค่า (Configuration)

ค่า config ทั้งหมดอยู่ใน ai_services/config.py และอ่านจากไฟล์ .env (root ของโปรเจกต์):

ตัวแปรค่า DefaultคำอธิบายGEMINI_API_KEY-API Key สำหรับเรียก Gemini APIGEMINI_MODELgemini-3.0-flashโมเดลที่ใช้สำหรับแชทและวิเคราะห์ข้อความ (chat, nutrition)GEMINI_VISION_MODELgemini-3.0-flash-visionโมเดลที่ใช้สำหรับวิเคราะห์รูปภาพ (food/ingredient detection)BACKEND_URLhttp://localhost:8000URL ของ FastAPI backend ที่ AI module เรียกใช้


🧩 Services

gemini_service.py

Core wrapper สำหรับเรียก Gemini API พร้อม retry logic (_call_with_retry) เมื่อเจอ rate limit (429 / RESOURCE_EXHAUSTED)


analyze_food_image(image_bytes, mime_type) → วิเคราะห์รูป คืน list ชื่อวัตถุดิบ (ใช้ GEMINI_VISION_MODEL)
chat_with_gemini(message, history) → แชทถาม-ตอบเรื่องอาหาร/โภชนาการ (ใช้ GEMINI_MODEL)

nutrition_service.py

วิเคราะห์ข้อมูลแคลอรี่และสารอาหาร คืนผลเป็น JSON object (food_name, calories, protein, carbs, fat, fiber, serving_size, summary)


analyze_nutrition(food_name) → จากชื่ออาหาร (ใช้ GEMINI_MODEL)
analyze_nutrition_from_image(image_bytes, mime_type) → จากรูปภาพ (ใช้ GEMINI_VISION_MODEL)

grocery_detection_service.py

detect_and_add_to_fridge(image_bytes, mime_type, token, user_id) → วิเคราะห์รูปด้วย Vision แล้วเพิ่มวัตถุดิบที่พบเข้าตู้เย็นของผู้ใช้ผ่าน POST /inventory/manual

integration.py

ฟังก์ชันเชื่อมต่อกับ backend API (ผ่าน httpx):

get_fridge_items(token)
get_recipe_suggestions(token)
get_recipe_detail(recipe_id, token)
check_missing_ingredients(token, recipe_id)

🔌 MCP Servers

vision_mcp.py — "SmartFood Vision AI"

Toolคำอธิบายscan_food_image_toolวิเคราะห์รูปภาพ → คืน list วัตถุดิบ (แทน YOLO)scan_and_add_to_fridge_toolวิเคราะห์รูป + เพิ่มเข้าตู้เย็นอัตโนมัติget_fridge_items_toolดึงรายการวัตถุดิบในตู้เย็นget_recipe_suggestions_toolขอเมนูแนะนำตามวัตถุดิบที่มีcheck_missing_ingredients_toolเช็กวัตถุดิบที่ขาด พร้อมลิงก์ Lotus'sask_food_ai_toolถามคำถามทั่วไปเรื่องอาหาร/โภชนาการ

nutrition_mcp.py — "SmartFood Nutrition AI"

Toolคำอธิบายanalyze_nutrition_toolวิเคราะห์โภชนาการจากชื่ออาหารanalyze_nutrition_from_image_toolวิเคราะห์โภชนาการจากรูปภาพ (รับ base64)

รันแต่ละ MCP server ได้โดยตรง:

bashpython mcp_servers/vision_mcp.py
python mcp_servers/nutrition_mcp.py


📦 Dependencies

ติดตั้งจาก requirements.txt:

bashpip install -r ai/requirements.txt

ประกอบด้วย: google-genai, fastapi, uvicorn, python-dotenv, httpx, fastmcp, pillow