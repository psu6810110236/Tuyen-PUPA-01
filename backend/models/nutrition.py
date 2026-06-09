from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_type = Column(String, nullable=False)   # breakfast, lunch, dinner, snack
    food_name = Column(String, nullable=False)   # "ข้าวผัด", "ส้มตำ"
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)        # หน่วย: กรัม
    carb = Column(Float, default=0.0)           # หน่วย: กรัม
    fat = Column(Float, default=0.0)            # หน่วย: กรัม
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String, default="manual")    # "manual" / "recipe" / "scan"

    # ความสัมพันธ์วิ่งกลับไปตระกูล User
    user = relationship("User", back_populates="nutrition_logs")