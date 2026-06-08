from sqlalchemy import Column, Integer, String
from database import Base  # ดึงมาจาก database.py ตัวนอกตรงๆ
from models.inventory import InventoryItem  # ดึงโมเดล InventoryItem มาใช้งานเพื่อสร้างความสัมพันธ์ (Relationship) ระหว่างตาราง 
from sqlalchemy.orm import relationship  # ใช้สำหรับสร้างความสัมพันธ์ระหว่างตารางใน SQLAlchemy ORM

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    inventory_items = relationship("InventoryItem", back_populates="owner", cascade="all, delete-orphan")