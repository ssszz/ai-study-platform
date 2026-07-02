from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), default="")
    time_limit_minutes = Column(Integer, nullable=False, default=30)
    pass_score = Column(Integer, nullable=False, default=60)
    total_score = Column(Integer, nullable=False, default=100)
    status = Column(String(20), nullable=False, default="draft")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    questions = relationship("ExamQuestion", back_populates="exam", order_by="ExamQuestion.sort_order")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    sort_order = Column(Integer, default=0)

    exam = relationship("Exam", back_populates="questions")
    question = relationship("Question")

class ExamSubmission(Base):
    __tablename__ = "exam_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=True)
    total_score = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="in_progress")
    start_time = Column(DateTime, nullable=False, default=func.now())
    submit_time = Column(DateTime, nullable=True)

    exam = relationship("Exam")
    answers = relationship("ExamAnswer", back_populates="submission")

class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("exam_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer = Column(JSON, nullable=True)
    is_correct = Column(Integer, nullable=True)
    score_earned = Column(Integer, default=0)

    submission = relationship("ExamSubmission", back_populates="answers")
    question = relationship("Question")
