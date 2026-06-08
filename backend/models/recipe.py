from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class RecipeSaved(Base):
    __tablename__ = "recipes_saved"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # เจ้าของเมนูที่เซฟ
    spoonacular_id = Column(Integer, nullable=False, index=True) # ไอดีสูตรอาหารจากภายนอก
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    ready_in_minutes = Column(Integer, nullable=True)
    servings = Column(Integer, nullable=True)
    saved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 🔗 ความสัมพันธ์ย้อนกลับไปยังตารางหลักของ User
    user = relationship("User", back_populates="saved_recipes")