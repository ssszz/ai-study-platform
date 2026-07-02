from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.types import JSON
from app.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    level = Column(String(10), nullable=False, default="L1")
    type = Column(String(20), nullable=False)
    title = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_answer = Column(JSON, nullable=False)
    score = Column(Integer, default=2)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
