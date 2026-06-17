import os
import requests
import sys

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# 1. สมัครสมาชิกก่อนหากยังไม่มีบัญชี
register_url = "http://localhost:8000/auth/register"
requests.post(register_url, json={"username": "devopstest", "password": "testpass"})

# ล็อกอินเอาโทเค็น
login_url = "http://localhost:8000/auth/login"
res_login = requests.post(login_url, data={"username": "devopstest", "password": "testpass"})
token = res_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. ล้างตู้เย็นเก่าก่อน
inv_url = "http://localhost:8000/inventory"
res_inv = requests.get(inv_url, headers=headers)
for item in res_inv.json():
    item_id = item["id"]
    requests.delete(f"{inv_url}/{item_id}", headers=headers)
print("Cleared old inventory.")

# 3. แอดของภาษาไทยแท้ลงตู้เย็น
requests.post(f"{inv_url}/manual", headers=headers, json={"name": "ไก่", "quantity": 500, "unit": "g", "category": "protein"})
requests.post(f"{inv_url}/manual", headers=headers, json={"name": "ไข่ไก่", "quantity": 10, "unit": "piece", "category": "protein"})
print("Added chicken and egg to fridge.")

# 4. เรียกคุยกับ AI Agent ถามของขาดทำข้าวผัดอกไก่ (สูตร ID: 1)
chat_url = "http://localhost:8000/agent/chat"
chat_body = {
    "messages": [
        {"role": "user", "content": "ช่วยเช็คให้หน่อยว่าถ้าจะทำเมนู ข้าวผัดอกไก่ (ใช้ไอดีสูตรอาหาร: 1) ฉันต้องซื้ออะไรเพิ่มบ้าง"}
    ]
}
print("Asking Gemini 3.1...")
res_chat = requests.post(chat_url, headers=headers, json=chat_body)

print("\n================== AI Response ==================")
print(res_chat.json()["response"])
print("=================================================")
