from pydantic import BaseModel, Field
from datetime import datetime

class ExamOut(BaseModel):
    id: int
    title: str
    description: str
    time_limit_minutes: int
    pass_score: int
    total_score: int
    status: str
    created_at: str | None = None
    question_count: int = 0
    submitted: bool = False
    model_config = {"from_attributes": True}

class ExamCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    time_limit_minutes: int = 30
    pass_score: int = 60
    question_ids: list[int] = Field(..., min_length=1)

class ExamTakeOut(BaseModel):
    id: int
    title: str
    description: str
    time_limit_minutes: int
    questions: list["QuestionForExam"]
    submission_id: int
    remaining_seconds: int | None = None

class QuestionForExam(BaseModel):
    id: int
    type: str
    title: str
    options: list
    score: int
    sort_order: int

class SubmitAnswer(BaseModel):
    question_id: int
    answer: list | str | bool | None = None

class SubmitExamRequest(BaseModel):
    submission_id: int
    answers: list[SubmitAnswer]

class ExamResultOut(BaseModel):
    id: int
    exam_id: int
    exam_title: str
    score: int
    total_score: int
    pass_score: int
    passed: bool
    submit_time: str | None = None
    answers: list["AnswerDetail"]

class AnswerDetail(BaseModel):
    question_id: int
    question_title: str
    question_type: str
    options: list
    correct_answer: list | str | bool
    user_answer: list | str | bool | None
    is_correct: bool | None
    score_earned: int
    max_score: int
