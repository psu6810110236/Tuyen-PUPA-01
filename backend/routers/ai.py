from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any

from routers.auth import get_current_user
from models.user import User
import services.ai_service as ai_service

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    รับข้อความจากผู้ใช้และประวัติแชท นำไปประมวลผลผ่าน Gemini API
    """
    if not payload.message:
        raise HTTPException(status_code=400, detail="ข้อความว่างเปล่า")
        
    reply_text = await ai_service.chat_with_gemini(payload.message, payload.history)
    return ChatResponse(reply=reply_text)
