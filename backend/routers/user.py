from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ----------------------------------------------------
# 📋 1. อ่านข้อมูลผู้ใช้ "ทั้งหมด" ในฐานข้อมูล (ดึงออกมาเป็น List)
# ----------------------------------------------------
@router.get("")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# ----------------------------------------------------
# 🔍 2. อ่านข้อมูล "เฉพาะเจาะจง" โดยค้นหาจาก ID (ดึงมาแค่คนเดียว)
# ----------------------------------------------------
@router.get("/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"ไม่พบผู้ใช้งาน ID: {user_id}"
        )
    return user

# ----------------------------------------------------
# 🏷️ 3. อ่านข้อมูลโดยใช้เงื่อนไขอื่น เช่น ค้นหาจาก Username
# ----------------------------------------------------
@router.get("/search/{username}")
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"ไม่พบผู้ใช้งานชื่อ: {username}"
        )
    return user
