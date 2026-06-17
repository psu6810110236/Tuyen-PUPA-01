from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import httpx

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
    ส่งรูปภาพไปให้ AI Service เพื่อวิเคราะห์หาส่วนผสม (Proxy)
    """
    ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ai_service_url}/ai/scan",
                json={"image_base64": payload.image_base64, "mime_type": payload.mime_type},
                timeout=120.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ไม่สามารถติดต่อ AI Service ได้: {str(exc)}"
            )

@router.post("/scan-and-add")
async def scan_and_add_endpoint(
    payload: ScanRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    ส่งรูปภาพไปให้ AI Service เพื่อวิเคราะห์และบันทึกวัตถุดิบลงตู้เย็นอัตโนมัติ (Proxy)
    """
    ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
    authorization = request.headers.get("Authorization")
    
    headers = {}
    if authorization:
        headers["Authorization"] = authorization

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ai_service_url}/ai/scan-and-add",
                json={"image_base64": payload.image_base64, "mime_type": payload.mime_type},
                headers=headers,
                timeout=120.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ไม่สามารถติดต่อ AI Service ได้: {str(exc)}"
            )
