from sqlalchemy import Column, Integer, Text, DateTime
from datetime import datetime
from database import Base


class RecipeCache(Base):
    """
    ตารางสำหรับเก็บ Cache ข้อมูลสูตรอาหารที่ดึงมาจาก Spoonacular API
    เพื่อลดจำนวน API Call และป้องกัน Rate Limit
    """
    __tablename__ = "recipe_cache"

    id             = Column(Integer, primary_key=True, index=True)
    spoonacular_id = Column(Integer, unique=True, index=True, nullable=False)
    data_json      = Column(Text, nullable=False)          # JSON string ของข้อมูลสูตรอาหารทั้งหมด
    cached_at      = Column(DateTime, default=datetime.utcnow)  # เวลาที่บันทึก Cache ครั้งแรก
