from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint

from database import Base


class Translation(Base):
    __tablename__ = "translations"
    __table_args__ = (
        UniqueConstraint("source_text", "direction", name="uq_translations_source_direction"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(String, nullable=False)
    translated_text = Column(String, nullable=False)
    direction = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
