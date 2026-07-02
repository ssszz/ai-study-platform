from pydantic import BaseModel, Field

class CategoryOut(BaseModel):
    id: int
    name: str
    description: str
    sort_order: int
    model_config = {"from_attributes": True}

class CourseOut(BaseModel):
    id: int
    title: str
    category_id: int
    level: str
    content: str
    read_time_minutes: int
    sort_order: int
    category: CategoryOut | None = None
    progress_status: str | None = None
    model_config = {"from_attributes": True}

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category_id: int
    level: str = "L1"
    content: str = ""
    read_time_minutes: int = 10

class CourseUpdate(BaseModel):
    title: str | None = None
    category_id: int | None = None
    level: str | None = None
    content: str | None = None
    read_time_minutes: int | None = None
