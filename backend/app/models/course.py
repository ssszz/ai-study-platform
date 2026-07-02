from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    sort_order = Column(Integer, default=0)

    courses = relationship("Course", back_populates="category")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    level = Column(String(10), nullable=False, default="L1")
    content = Column(Text, default="")
    read_time_minutes = Column(Integer, default=10)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="courses")

class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(String(20), nullable=False, default="not_started")
    completed_at = Column(DateTime, nullable=True)
