import os
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# สร้าง Client (จะดึงจาก GEMINI_API_KEY ใน os.environ อัตโนมัติถ้าตั้งค่าไว้ แต่เราสามารถใส่เพื่อความชัวร์)
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

async def chat_with_gemini(message: str, history: list) -> str:
    if not client:
        return "ขออภัยค่ะ ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบ กรุณาตรวจสอบไฟล์ .env"
    
    # รวมประวัติการสนทนาเป็นข้อความเดียวเพื่อให้โมเดลเข้าใจบริบท (Stateless Memory)
    prompt = (
        "คุณคือ TUYEN AI ผู้ช่วยด้านโภชนาการส่วนตัวที่เชี่ยวชาญ เป็นมิตร และให้คำแนะนำแบบมืออาชีพ\n"
        "ใช้ภาษาไทยในการตอบ ตอบกระชับ เข้าใจง่าย และให้กำลังใจผู้ใช้\n\n"
        "--- ประวัติการสนทนาก่อนหน้า ---\n"
    )
    
    for msg in history:
        role_label = "ผู้ใช้งาน" if msg.get("role") == "user" else "TUYEN AI"
        prompt += f"{role_label}: {msg.get('content')}\n"
        
    prompt += f"\nผู้ใช้งาน: {message}\nTUYEN AI:"

    try:
        # ใช้ gemini-2.5-flash (โมเดลตัวล่าสุดและเร็วที่สุดของเวอร์ชัน flash) หรือใช้ 1.5-flash ได้เช่นกัน
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: {str(e)}"
