from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import httpx
import base64
from sqlalchemy.orm import Session

from database import get_db
from routers.auth import get_current_user
from models.user import User
import services.ai_service as ai_service

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    reply: str

class ScanRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    รับข้อความจากผู้ใช้และประวัติแชท นำไปประมวลผลผ่าน Gemini API
    """
    if not payload.message:
        raise HTTPException(status_code=400, detail="ข้อความว่างเปล่า")
        
    reply_text = await ai_service.chat_with_gemini(payload.message, payload.history)
    return ChatResponse(reply=reply_text)

@router.post("/scan")
async def scan_endpoint(payload: ScanRequest, current_user: User = Depends(get_current_user)):
    """
    วิเคราะห์รูปภาพหาส่วนผสม (ใช้ Local AI หรือ Proxy ไปยัง AI Service)
    """
    ai_service_url = os.getenv("AI_SERVICE_URL")
    
    # ถ้ามีการตั้งค่า AI_SERVICE_URL ให้ลอง Proxy ก่อน (ข้ามเครื่อง local ใน production)
    if ai_service_url and not any(local in ai_service_url for local in ["localhost", "127.0.0.1", "host.docker.internal"]):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{ai_service_url}/ai/scan",
                    json={"image_base64": payload.image_base64, "mime_type": payload.mime_type},
                    timeout=120.0
                )
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"[AI Proxy Fallback] Failed to proxy scan, falling back to local: {e}")

    # รันวิเคราะห์ด้วยโมเดล Gemini Vision ท้องถิ่นโดยตรงบน Backend (100% self-contained)
    try:
        image_bytes = base64.b64decode(payload.image_base64)
        ingredients = await ai_service.analyze_food_image(image_bytes, payload.mime_type)
        return {"ingredients": ingredients}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการประมวลผลรูปภาพ: {str(e)}"
        )

@router.post("/scan-and-add")
async def scan_and_add_endpoint(
    payload: ScanRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    วิเคราะห์และบันทึกวัตถุดิบลงตู้เย็นอัตโนมัติ (ใช้ Local AI หรือ Proxy ไปยัง AI Service)
    """
    ai_service_url = os.getenv("AI_SERVICE_URL")
    
    if ai_service_url and not any(local in ai_service_url for local in ["localhost", "127.0.0.1", "host.docker.internal"]):
        authorization = request.headers.get("Authorization")
        headers = {"Authorization": authorization} if authorization else {}
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{ai_service_url}/ai/scan-and-add",
                    json={"image_base64": payload.image_base64, "mime_type": payload.mime_type},
                    headers=headers,
                    timeout=120.0
                )
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"[AI Proxy Fallback] Failed to proxy scan-and-add, falling back to local: {e}")

    # รันระบบสแกนและบันทึกลงตู้เย็นโดยตรงบน Backend
    try:
        image_bytes = base64.b64decode(payload.image_base64)
        result = await ai_service.detect_and_add_to_fridge_local(image_bytes, payload.mime_type, db, current_user)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ: {str(e)}"
        )

