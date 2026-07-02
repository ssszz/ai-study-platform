from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)

class LoginResponse(BaseModel):
    token: str
    user: "UserOut"

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=50)

class UserOut(BaseModel):
    id: int
    username: str
    real_name: str
    department: str
    role: str
    is_active: int
    created_at: str | None = None

    model_config = {"from_attributes": True}

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=50)
    real_name: str = Field(..., min_length=1, max_length=50)
    department: str = ""
    role: str = "user"

class UserUpdate(BaseModel):
    real_name: str | None = None
    department: str | None = None
    role: str | None = None
    is_active: int | None = None
