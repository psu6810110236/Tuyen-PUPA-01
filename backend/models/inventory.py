from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # เจ้าของตู้เย็น
    
    name = Column(String, nullable=False)          # "ไข่ไก่", "หมูสับ"
    quantity = Column(Float, nullable=False, default=1.0) # 3, 0.5
    unit = Column(String, nullable=False)          # "ฟอง", "กิโลกรัม"
    category = Column(String, nullable=True)       # "protein", "veggie", "dairy"
    expiry_date = Column(Date, nullable=True)      # วันหมดอายุ (ถ้ามี)
    added_by = Column(String, nullable=False)      # "scan" หรือ "manual"
    
    # ระบบบันทึกเวลาอัตโนมัติ
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 🔗 ทำความสัมพันธ์ย้อนกลับไปที่ตาราง User (Relationship) เพื่อช่วยให้ดึงข้อมูลง่ายขึ้นในอนาคต
    owner = relationship("User", back_populates="inventory_items")