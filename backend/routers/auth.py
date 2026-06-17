import os
import secrets
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt  # ใช้ bcrypt ดิบโดยตรง ตัด passlib ทิ้งถาวร
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# 🛠️ พาธการดึงข้อมูลตามโครงสร้างจริงของคุณ
from database import get_db, engine
from models.user import User 

# สั่งสร้างตารางให้อัตโนมัติในฐานข้อมูล
User.metadata.create_all(bind=engine)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# ดึงค่าคอนฟิกจาก .env
SECRET_KEY = os.getenv("SECRET_KEY")
# รายการคีย์ตั้งต้นที่เป็นอันตรายในระดับโปรดักชัน
WEAK_KEYS = {"super-secret-key-xyz-123456789", "your-super-secret-key-for-jwt", "Super-Very-Secret-Key"}

if not SECRET_KEY or SECRET_KEY in WEAK_KEYS:
    # 🔐 ความปลอดภัยระดับ Enterprise: สุ่มคีย์ลับขนาด 256 บิตขึ้นมาใน RAM เมื่อตรวจเจอบทบาทความปลอดภัยที่อ่อนแอ
    SECRET_KEY = secrets.token_hex(32)
    print("[Security WARNING] JWT SECRET_KEY is empty or weak. Generated a secure random key dynamically in RAM.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# 🛠️ ปรับ tokenUrl ให้ตรงกับ Route จริง
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# 📋 Pydantic Schemas
class UserAuthSchema(BaseModel):
    username: str
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str


# --- 🛠️ [ ปรับแต่งระบบ Helpers ให้รองรับ bcrypt ดิบ ] ---

def hash_password(password: str) -> str:
    # 1. แปลงรหัสผ่านที่เป็นตัวหนังสือ (str) ให้เป็น bytes
    password_bytes = password.encode('utf-8')
    # 2. สร้าง Salt สำหรับความปลอดภัย
    salt = bcrypt.gensalt()
    # 3. ทำการแฮชรหัสผ่าน
    hashed = bcrypt.hashpw(password_bytes, salt)
    # 4. แปลงจาก bytes กลับเป็นตัวหนังสือ (str) เพื่อเอาไปเซฟลงฐานข้อมูล PostgreSQL
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # แปลงทั้งรหัสที่กรอกเข้ามา และรหัสที่ดึงมาจากเบสให้เป็น bytes ก่อนส่งให้ bcrypt ตรวจสอบ
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="โทเค็นไม่ถูกต้อง หรือหมดอายุแล้ว",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# --- 🚀 [ API Routes ] ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserAuthSchema, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(username=user_data.username, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"message": "สมัครสมาชิกสำเร็จแล้ว!"}

@router.post("/login", response_model=TokenSchema)
def login(user_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Username หรือ Password ไม่ถูกต้อง")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    เส้นทางสำหรับการ Log out 
    ฝั่ง Backend ทำการตรวจสอบสิทธิ์ว่าตั๋วถูกต้องไหม 
    จากนั้นส่งสัญญาณแจ้งให้ฝั่ง Frontend ทำการลบ Token ออกจากหน่วยความจำเบราว์เซอร์
    """
    # ในกรณีต้องการทำระบบ Blacklist Token สามารถนำตัวแปร `token` มาบันทึกลงฐานข้อมูลตรงจุดนี้ได้ครับ
    return {
        "message": f"คุณ {current_user.username} ออกจากระบบเรียบร้อยแล้ว อย่าลืมเคลียร์ Token ฝั่ง Frontend นะครับ!"
    }