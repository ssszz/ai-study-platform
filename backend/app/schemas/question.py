from pydantic import BaseModel, Field

class QuestionOut(BaseModel):
    id: int
    category_id: int
    level: str
    type: str
    title: str
    options: list
    correct_answer: list | str | bool | None = None
    score: int
    model_config = {"from_attributes": True}

class QuestionListOut(BaseModel):
    id: int
    category_id: int
    level: str
    type: str
    title: str
    options: list = []
    correct_answer: list | str | bool | None = None
    score: int
    model_config = {"from_attributes": True}

class QuestionCreate(BaseModel):
    category_id: int
    level: str = "L1"
    type: str
    title: str = Field(..., min_length=1)
    options: list = []
    correct_answer: list | str | bool
    score: int = 2

class QuestionUpdate(BaseModel):
    category_id: int | None = None
    level: str | None = None
    type: str | None = None
    title: str | None = None
    options: list | None = None
    correct_answer: list | str | bool | None = None
    score: int | None = None
