# AI 研习社 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a department AI learning platform with courses, quizzes, exams, auto-grading, and analytics.

**Architecture:** FastAPI backend with SQLAlchemy + SQLite, React frontend with shadcn/ui + Tailwind. JWT auth with user/admin roles. RESTful API with automatic grading for single/multi/true-false questions.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, SQLite, bcrypt, PyJWT, React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Recharts

## Global Constraints

- SQLite database only (single file, portable)
- JWT token expiry: 7 days
- Default admin: username `admin`, password `admin123`
- Frontend port :5173, backend port :8000
- All auto-grading: single/true-false = exact match; multi = full correct → full score, partial → half, wrong → zero
- 9 categories, 3 levels (L1/L2/L3), 3 question types (single/multi/true_false)
- 15 preset courses, ~120 preset questions

---

## Phase 1: Backend Foundation

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`

**Produces:**
- `Settings` class with DATABASE_URL, SECRET_KEY, JWT_EXPIRY_DAYS
- `get_db()` dependency yielding SQLAlchemy sessions
- `Base` declarative base
- FastAPI app with CORS middleware

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p backend/app/{models,schemas,routers,services}
```

- [ ] **Step 2: Write requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
pydantic==2.10.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.18
```

- [ ] **Step 3: Write config.py**

```python
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings:
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'ai_study.db')}"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aistudy-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    APP_TITLE: str = "AI 研习社"
    APP_VERSION: str = "1.0.0"

settings = Settings()
```

- [ ] **Step 4: Write database.py**

```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: Write main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

app = FastAPI(title=settings.APP_TITLE, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from app.seed import init_data
    init_data()

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Install dependencies and verify**

```bash
cd backend && pip install -r requirements.txt
python -c "from app.main import app; print('OK')"
```

Expected: prints "OK"

- [ ] **Step 7: Commit**

---

### Task 2: Database Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/course.py`
- Create: `backend/app/models/question.py`
- Create: `backend/app/models/exam.py`

**Produces:**
- `User` model: id, username, password, real_name, department, role, is_active, created_at, updated_at
- `Category` model: id, name, description, sort_order
- `Course` model: id, title, category_id(FK), level, content, read_time_minutes, sort_order, created_at, updated_at
- `CourseProgress` model: id, user_id(FK), course_id(FK), status, completed_at
- `Question` model: id, category_id(FK), level, type, title, options(JSON), correct_answer(JSON), score, created_at, updated_at
- `Exam` model: id, title, description, time_limit_minutes, pass_score, total_score, status, created_by(FK), created_at
- `ExamQuestion` model: id, exam_id(FK), question_id(FK), sort_order
- `ExamSubmission` model: id, exam_id(FK), user_id(FK), score, total_score, status, start_time, submit_time
- `ExamAnswer` model: id, submission_id(FK), question_id(FK), user_answer(JSON), is_correct, score_earned

- [ ] **Step 1: Write models/__init__.py**

```python
from app.models.user import User
from app.models.course import Category, Course, CourseProgress
from app.models.question import Question
from app.models.exam import Exam, ExamQuestion, ExamSubmission, ExamAnswer

__all__ = [
    "User", "Category", "Course", "CourseProgress",
    "Question", "Exam", "ExamQuestion", "ExamSubmission", "ExamAnswer",
]
```

- [ ] **Step 2: Write models/user.py**

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    department = Column(String(100), default="")
    role = Column(String(20), nullable=False, default="user")
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

- [ ] **Step 3: Write models/course.py**

```python
from datetime import datetime
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
```

- [ ] **Step 4: Write models/question.py**

```python
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
```

- [ ] **Step 5: Write models/exam.py**

```python
from datetime import datetime
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
```

- [ ] **Step 6: Verify models create tables**

```bash
cd backend && python -c "
from app.database import engine, Base
from app.models import *
Base.metadata.create_all(bind=engine)
print('Tables created OK')
"
```

Expected: "Tables created OK"

- [ ] **Step 7: Commit**

---

### Task 3: Auth System

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`

**Interfaces:**
- Produces:
  - `hash_password(password: str) -> str`
  - `verify_password(plain: str, hashed: str) -> bool`
  - `create_token(user_id: int, role: str) -> str`
  - `decode_token(token: str) -> dict | None`
  - `get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User`
  - `require_admin(current_user: User = Depends(get_current_user)) -> User`

- [ ] **Step 1: Write services/auth_service.py**

```python
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRY_DAYS)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
```

- [ ] **Step 2: Write schemas/auth.py**

```python
from pydantic import BaseModel, Field

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
```

- [ ] **Step 3: Write routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, ChangePasswordRequest, UserOut
from app.services.auth_service import hash_password, verify_password, create_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    token = create_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    current_user.password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
```

- [ ] **Step 4: Register auth router in main.py**

```python
# In main.py, after app = FastAPI(...), before @app.on_event:
from app.routers.auth import router as auth_router
app.include_router(auth_router)
```

- [ ] **Step 5: Verify auth works**

```bash
cd backend && python -c "
from app.services.auth_service import hash_password, verify_password, create_token, decode_token
h = hash_password('test')
assert verify_password('test', h)
assert not verify_password('wrong', h)
token = create_token(1, 'admin')
payload = decode_token(token)
assert payload['sub'] == '1'
assert payload['role'] == 'admin'
print('Auth service OK')
"
```

- [ ] **Step 6: Commit**

---

### Task 4: Seed Data

**Files:**
- Create: `backend/app/seed.py`

**Interfaces:**
- Consumes: `User`, `Category`, `Course`, `Question` models; `hash_password` from auth_service
- Produces: `init_data()` — idempotent seeder called on startup

- [ ] **Step 1: Write seed.py**

```python
import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.course import Category, Course
from app.models.question import Question
from app.services.auth_service import hash_password

CATEGORIES = [
    (1, "AI基础概念", "什么是AI、LLM原理、Token、Embedding等", 1),
    (2, "提示词工程", "Prompt设计、Few-shot、Chain-of-Thought、System Prompt", 2),
    (3, "灵基平台概览", "灵基定位、架构、三大模式、核心理念", 3),
    (4, "灵基Chat模式", "对话协作、知识库检索、数据分析、方案起草", 4),
    (5, "灵基Work模式", "任务承接、流程执行、Agent调度、结果交付", 5),
    (6, "灵基Build模式", "低代码搭建、VibeCoding、原型探索、应用生成", 6),
    (7, "Skill技能开发", "MCP协议、业务封装、技能组合、可复用沉淀", 7),
    (8, "Agent智能体开发", "六维定义模型、创建编排、生命周期管理", 8),
    (9, "AI治理与安全", "权限控制、审计追踪、责任链、数据合规", 9),
]

COURSES = [
    (1, "AI是什么：从图灵测试到ChatGPT", 1, "L1", 15),
    (2, "大语言模型（LLM）入门", 1, "L1", 15),
    (3, "认识金蝶灵基平台", 3, "L1", 10),
    (4, "灵基Chat模式快速上手", 4, "L1", 10),
    (5, "AI使用中的安全常识", 9, "L1", 10),
    (6, "提示词工程实战", 2, "L2", 20),
    (7, "灵基Work模式详解", 5, "L2", 15),
    (8, "什么是Skill技能", 7, "L2", 15),
    (9, "什么是Agent智能体", 8, "L2", 15),
    (10, "MCP协议入门", 7, "L2", 15),
    (11, "Skill开发实战：MCP业务技能封装", 7, "L3", 25),
    (12, "Agent六维定义与创建", 8, "L3", 25),
    (13, "Agent编排与调度", 8, "L3", 25),
    (14, "灵基Build模式全流程", 6, "L3", 25),
    (15, "Agent治理与审计实践", 9, "L3", 20),
]

def get_sample_questions():
    """Return a list of dicts with question data."""
    questions = []

    # L1 questions - category 1: AI基础概念
    L1_single = [
        {
            "title": "以下哪项最能准确描述人工智能（AI）？",
            "options": ["A. 一种只能执行数学计算的机器", "B. 模拟人类智能的计算机系统", "C. 一种新型的编程语言", "D. 只能用于图像识别的技术"],
            "answer": "B",
            "category_id": 1, "level": "L1", "type": "single", "score": 2,
        },
        {
            "title": "ChatGPT 是由哪家公司开发的？",
            "options": ["A. Google", "B. Microsoft", "C. OpenAI", "D. Meta"],
            "answer": "C",
            "category_id": 1, "level": "L1", "type": "single", "score": 2,
        },
    ]
    for q in L1_single:
        questions.append(q)

    # L1 multi questions
    L1_multi = [
        {
            "title": "以下哪些属于AI的应用场景？（多选）",
            "options": ["A. 智能客服", "B. 图像识别", "C. 自动驾驶", "D. 语音助手"],
            "answer": ["A", "B", "C", "D"],
            "category_id": 1, "level": "L1", "type": "multi", "score": 4,
        },
    ]
    for q in L1_multi:
        questions.append(q)

    # L1 true_false questions
    L1_tf = [
        {
            "title": "AI可以完全替代人类的所有工作，不需要人类参与。",
            "options": [],
            "answer": False,
            "category_id": 1, "level": "L1", "type": "true_false", "score": 1,
        },
    ]
    for q in L1_tf:
        questions.append(q)

    return questions

def init_data():
    db: Session = SessionLocal()
    try:
        # Admin user
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                password=hash_password("admin123"),
                real_name="管理员",
                department="技术部",
                role="admin",
            ))
            db.commit()

        # Categories
        for cid, name, desc, order in CATEGORIES:
            if not db.query(Category).filter(Category.id == cid).first():
                db.add(Category(id=cid, name=name, description=desc, sort_order=order))
        db.commit()

        # Courses
        for cid, title, cat_id, level, mins in COURSES:
            if not db.query(Course).filter(Course.id == cid).first():
                db.add(Course(
                    id=cid, title=title, category_id=cat_id,
                    level=level, read_time_minutes=mins,
                    content=f"# {title}\n\n课程内容加载中...\n\n请管理员编辑课程内容。",
                ))
        db.commit()

        # Questions
        existing_count = db.query(Question).count()
        if existing_count == 0:
            for q_data in get_sample_questions():
                db.add(Question(**q_data))
            db.commit()

        print(f"Seed data OK: {db.query(User).count()} users, {db.query(Question).count()} questions")
    finally:
        db.close()

if __name__ == "__main__":
    init_data()
```

- [ ] **Step 2: Run seed and verify**

```bash
cd backend && python -m app.seed
```

Expected: "Seed data OK: 1 users, N questions"

- [ ] **Step 3: Commit**

---

## Phase 2: Backend APIs

### Task 5: User Management API

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/routers/users.py`

**Interfaces:**
- Consumes: `get_current_user`, `require_admin` from auth router
- Produces: CRUD endpoints at `/api/users`

- [ ] **Step 1: Write schemas/user.py** (re-exports UserOut, UserCreate, UserUpdate from auth schemas to keep things organized)

```python
from app.schemas.auth import UserOut, UserCreate, UserUpdate
```

- [ ] **Step 2: Write routers/users.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut, UserCreate, UserUpdate
from app.routers.auth import get_current_user, require_admin
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return [UserOut.model_validate(u) for u in db.query(User).all()]

@router.post("", response_model=UserOut)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=body.username,
        password=hash_password(body.password),
        real_name=body.real_name,
        department=body.department,
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin" and db.query(User).filter(User.role == "admin", User.id != user_id).count() == 0:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
```

- [ ] **Step 3: Register in main.py**

```python
from app.routers.users import router as users_router
app.include_router(users_router)
```

- [ ] **Step 4: Commit**

---

### Task 6: Course API

**Files:**
- Create: `backend/app/schemas/course.py`
- Create: `backend/app/routers/courses.py`

**Interfaces:**
- Consumes: `get_current_user`, `require_admin`
- Produces: Course CRUD + progress tracking endpoints

- [ ] **Step 1: Write schemas/course.py**

```python
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
```

- [ ] **Step 2: Write routers/courses.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.course import Category, Course, CourseProgress
from app.schemas.course import CourseOut, CourseCreate, CourseUpdate, CategoryOut
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order).all()

@router.get("", response_model=list[CourseOut])
def list_courses(
    category_id: int | None = Query(None),
    level: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Course).options(joinedload(Course.category))
    if category_id:
        q = q.filter(Course.category_id == category_id)
    if level:
        q = q.filter(Course.level == level)
    courses = q.order_by(Course.sort_order).all()

    # Attach progress for current user
    progress_map = {}
    if current_user:
        progresses = db.query(CourseProgress).filter(
            CourseProgress.user_id == current_user.id
        ).all()
        progress_map = {p.course_id: p.status for p in progresses}

    result = []
    for c in courses:
        co = CourseOut.model_validate(c)
        co.progress_status = progress_map.get(c.id, "not_started")
        result.append(co)
    return result

@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).options(joinedload(Course.category)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    co = CourseOut.model_validate(course)
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id,
    ).first()
    co.progress_status = progress.status if progress else "not_started"
    return co

@router.post("/{course_id}/complete")
def complete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id,
    ).first()
    if progress:
        progress.status = "completed"
    else:
        progress = CourseProgress(user_id=current_user.id, course_id=course_id, status="completed")
        db.add(progress)
    db.commit()
    return {"message": "Course marked as completed"}

@router.post("", response_model=CourseOut)
def create_course(
    body: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = Course(**body.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)

@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(course, key, val)
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}
```

- [ ] **Step 3: Register in main.py**

```python
from app.routers.courses import router as courses_router
app.include_router(courses_router)
```

- [ ] **Step 4: Commit**

---

### Task 7: Question API

**Files:**
- Create: `backend/app/schemas/question.py`
- Create: `backend/app/routers/questions.py`

- [ ] **Step 1: Write schemas/question.py**

```python
from pydantic import BaseModel, Field

class QuestionOut(BaseModel):
    id: int
    category_id: int
    level: str
    type: str
    title: str
    options: list
    correct_answer: list | str | bool | None = None  # None when querying from exam
    score: int
    model_config = {"from_attributes": True}

class QuestionListOut(BaseModel):
    id: int
    category_id: int
    level: str
    type: str
    title: str
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
```

- [ ] **Step 2: Write routers/questions.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.schemas.question import QuestionOut, QuestionListOut, QuestionCreate, QuestionUpdate
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("", response_model=list[QuestionListOut])
def list_questions(
    category_id: int | None = Query(None),
    level: str | None = Query(None),
    type: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question)
    if category_id:
        q = q.filter(Question.category_id == category_id)
    if level:
        q = q.filter(Question.level == level)
    if type:
        q = q.filter(Question.type == type)
    if search:
        q = q.filter(Question.title.contains(search))
    return q.order_by(Question.id.desc()).limit(200).all()

@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionOut.model_validate(question)

@router.post("", response_model=QuestionOut)
def create_question(
    body: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = Question(**body.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionOut.model_validate(question)

@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    body: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(question, key, val)
    db.commit()
    db.refresh(question)
    return QuestionOut.model_validate(question)

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return {"message": "Question deleted"}
```

- [ ] **Step 3: Register in main.py**

```python
from app.routers.questions import router as questions_router
app.include_router(questions_router)
```

- [ ] **Step 4: Commit**

---

### Task 8: Exam API & Grading Service

**Files:**
- Create: `backend/app/schemas/exam.py`
- Create: `backend/app/services/grading_service.py`
- Create: `backend/app/services/exam_service.py`
- Create: `backend/app/routers/exams.py`

**Interfaces:**
- Produces:
  - `grade_question(question_type: str, correct_answer, user_answer) -> (bool, int)` — returns (is_correct, score_earned)
  - `grade_submission(submission: ExamSubmission, db: Session) -> int` — grades all answers, returns total score
  - Exam CRUD + take/submit/result endpoints

- [ ] **Step 1: Write services/grading_service.py**

```python
def grade_question(question_type: str, correct_answer, user_answer, max_score: int) -> tuple[bool, int]:
    """Returns (is_correct, score_earned)."""
    if user_answer is None:
        return (False, 0)

    if question_type == "true_false":
        is_correct = bool(user_answer) == bool(correct_answer)
        return (is_correct, max_score if is_correct else 0)

    elif question_type == "single":
        is_correct = str(user_answer).strip().upper() == str(correct_answer).strip().upper()
        return (is_correct, max_score if is_correct else 0)

    elif question_type == "multi":
        if not isinstance(user_answer, list):
            user_answer = [user_answer]
        correct_set = set(str(a).strip().upper() for a in correct_answer)
        user_set = set(str(a).strip().upper() for a in user_answer)

        correct_count = len(user_set & correct_set)
        wrong_count = len(user_set - correct_set)
        total_correct = len(correct_set)

        if wrong_count > 0:
            return (False, 0)
        elif correct_count == total_correct:
            return (True, max_score)
        elif correct_count > 0:
            return (False, max_score // 2)
        else:
            return (False, 0)

    return (False, 0)
```

- [ ] **Step 2: Write services/exam_service.py**

```python
from sqlalchemy.orm import Session
from app.models.exam import ExamSubmission, ExamAnswer
from app.services.grading_service import grade_question

def grade_submission(submission_id: int, db: Session) -> int:
    submission = db.query(ExamSubmission).filter(ExamSubmission.id == submission_id).first()
    if not submission:
        return 0

    answers = db.query(ExamAnswer).filter(ExamAnswer.submission_id == submission_id).all()
    total = 0

    for answer in answers:
        question = answer.question
        is_correct, score = grade_question(
            question_type=question.type,
            correct_answer=question.correct_answer,
            user_answer=answer.user_answer,
            max_score=question.score,
        )
        answer.is_correct = 1 if is_correct else 0
        answer.score_earned = score
        total += score

    submission.score = total
    submission.status = "submitted"
    db.commit()
    return total
```

- [ ] **Step 3: Write schemas/exam.py**

```python
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

# Nested model for question bank selection
class QuestionBankItem(BaseModel):
    id: int
    category_id: int
    level: str
    type: str
    title: str
    score: int
    category_name: str = ""
```

- [ ] **Step 4: Write routers/exams.py**

```python
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.models.course import Category
from app.models.exam import Exam, ExamQuestion, ExamSubmission, ExamAnswer
from app.schemas.exam import (
    ExamOut, ExamCreate, ExamTakeOut, QuestionForExam,
    SubmitExamRequest, ExamResultOut, AnswerDetail, QuestionBankItem,
)
from app.routers.auth import get_current_user, require_admin
from app.services.exam_service import grade_submission

router = APIRouter(prefix="/api/exams", tags=["exams"])

@router.get("", response_model=list[ExamOut])
def list_exams(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Exam).options(joinedload(Exam.questions))
    if status:
        q = q.filter(Exam.status == status)
    exams = q.order_by(Exam.created_at.desc()).all()

    result = []
    for exam in exams:
        eo = ExamOut(
            id=exam.id,
            title=exam.title,
            description=exam.description,
            time_limit_minutes=exam.time_limit_minutes,
            pass_score=exam.pass_score,
            total_score=exam.total_score,
            status=exam.status,
            created_at=str(exam.created_at) if exam.created_at else None,
            question_count=len(exam.questions),
        )
        sub = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam.id,
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.status == "submitted",
        ).first()
        eo.submitted = sub is not None
        result.append(eo)
    return result

@router.post("", response_model=ExamOut)
def create_exam(
    body: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Calculate total score
    questions = db.query(Question).filter(Question.id.in_(body.question_ids)).all()
    total_score = sum(q.score for q in questions)

    exam = Exam(
        title=body.title,
        description=body.description,
        time_limit_minutes=body.time_limit_minutes,
        pass_score=body.pass_score,
        total_score=total_score,
        status="published",
        created_by=current_user.id,
    )
    db.add(exam)
    db.flush()

    for i, qid in enumerate(body.question_ids):
        db.add(ExamQuestion(exam_id=exam.id, question_id=qid, sort_order=i + 1))

    db.commit()
    db.refresh(exam)
    return ExamOut(
        id=exam.id, title=exam.title, description=exam.description,
        time_limit_minutes=exam.time_limit_minutes, pass_score=exam.pass_score,
        total_score=exam.total_score, status=exam.status,
        question_count=len(body.question_ids),
    )

@router.get("/{exam_id}", response_model=ExamTakeOut)
def take_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = db.query(Exam).options(joinedload(Exam.questions)).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status != "published":
        raise HTTPException(status_code=400, detail="Exam is not available")

    # Find or create submission
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "in_progress",
    ).first()

    if not submission:
        # Check if already submitted
        existing = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam_id,
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.status == "submitted",
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You have already submitted this exam")

        submission = ExamSubmission(
            exam_id=exam_id,
            user_id=current_user.id,
            total_score=exam.total_score,
            status="in_progress",
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    # Build question list without correct answers
    eqs = sorted(exam.questions, key=lambda x: x.sort_order)
    questions = []
    for eq in eqs:
        q = eq.question
        questions.append(QuestionForExam(
            id=q.id, type=q.type, title=q.title,
            options=q.options, score=q.score, sort_order=eq.sort_order,
        ))

    # Calculate remaining time
    elapsed = (datetime.now(timezone.utc) - submission.start_time.replace(tzinfo=timezone.utc)).total_seconds()
    remaining = max(0, exam.time_limit_minutes * 60 - int(elapsed))

    return ExamTakeOut(
        id=exam.id, title=exam.title, description=exam.description,
        time_limit_minutes=exam.time_limit_minutes,
        questions=questions, submission_id=submission.id,
        remaining_seconds=remaining,
    )

@router.post("/{exam_id}/submit", response_model=ExamResultOut)
def submit_exam(
    exam_id: int,
    body: SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == body.submission_id if hasattr(body, 'submission_id') else None,
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "in_progress",
    ).first()

    if not submission:
        # Find the latest in-progress submission
        submission = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam_id,
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.status == "in_progress",
        ).order_by(ExamSubmission.id.desc()).first()

    if not submission:
        raise HTTPException(status_code=400, detail="No active submission found")

    # Save answers
    answer_map = {a.question_id: a.answer for a in body.answers}
    for ans in body.answers:
        existing = db.query(ExamAnswer).filter(
            ExamAnswer.submission_id == submission.id,
            ExamAnswer.question_id == ans.question_id,
        ).first()
        if existing:
            existing.user_answer = ans.answer
        else:
            db.add(ExamAnswer(
                submission_id=submission.id,
                question_id=ans.question_id,
                user_answer=ans.answer,
            ))

    db.commit()

    # Grade
    total = grade_submission(submission.id, db)
    db.refresh(submission)

    # Build result
    return build_result(submission, db)

def build_result(submission: ExamSubmission, db: Session) -> ExamResultOut:
    answers = db.query(ExamAnswer).filter(
        ExamAnswer.submission_id == submission.id
    ).all()

    answer_details = []
    for a in answers:
        q = a.question
        answer_details.append(AnswerDetail(
            question_id=q.id,
            question_title=q.title,
            question_type=q.type,
            options=q.options,
            correct_answer=q.correct_answer,
            user_answer=a.user_answer,
            is_correct=bool(a.is_correct) if a.is_correct is not None else None,
            score_earned=a.score_earned,
            max_score=q.score,
        ))

    exam = submission.exam
    return ExamResultOut(
        id=submission.id,
        exam_id=exam.id,
        exam_title=exam.title,
        score=submission.score or 0,
        total_score=submission.total_score,
        pass_score=exam.pass_score,
        passed=(submission.score or 0) >= exam.pass_score,
        submit_time=str(submission.submit_time) if submission.submit_time else None,
        answers=answer_details,
    )

@router.get("/{exam_id}/result", response_model=list[ExamResultOut])
def get_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).all()

    return [build_result(s, db) for s in submissions]
```

- [ ] **Step 5: Register in main.py and fix submit endpoint**

The submit endpoint needs the submission_id from the request body. Update the SubmitExamRequest schema to include it:

In `schemas/exam.py`, update:
```python
class SubmitExamRequest(BaseModel):
    submission_id: int
    answers: list[SubmitAnswer]
```

Then update the submit endpoint to use `body.submission_id`.

- [ ] **Step 6: Register in main.py**

```python
from app.routers.exams import router as exams_router
app.include_router(exams_router)
```

- [ ] **Step 7: Commit**

---

### Task 9: Stats API

**Files:**
- Create: `backend/app/routers/stats.py`

- [ ] **Step 1: Write routers/stats.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.course import Course, CourseProgress
from app.models.exam import ExamSubmission, ExamAnswer
from app.models.question import Question
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.status == "completed",
    ).count()
    in_progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.status == "in_progress",
    ).count()
    total_courses = db.query(Course).count()

    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).all()

    exam_count = len(submissions)
    avg_score = round(sum(s.score or 0 for s in submissions) / max(exam_count, 1), 1)

    # Recent exams
    recent_exams = []
    for s in sorted(submissions, key=lambda x: x.submit_time or "", reverse=True)[:5]:
        recent_exams.append({
            "exam_id": s.exam_id,
            "exam_title": s.exam.title,
            "score": s.score,
            "total_score": s.total_score,
            "submit_time": str(s.submit_time) if s.submit_time else None,
        })

    # Recent courses in progress
    recent_courses = []
    progresses = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
    ).order_by(CourseProgress.id.desc()).limit(5).all()
    for p in progresses:
        course = db.query(Course).filter(Course.id == p.course_id).first()
        if course:
            recent_courses.append({
                "course_id": course.id,
                "title": course.title,
                "status": p.status,
                "level": course.level,
            })

    # Popular courses (top 5 by completion count)
    popular = []
    pop_data = db.query(
        CourseProgress.course_id,
        func.count(CourseProgress.id).label("cnt")
    ).filter(CourseProgress.status == "completed").group_by(
        CourseProgress.course_id
    ).order_by(func.count(CourseProgress.id).desc()).limit(5).all()
    for course_id, cnt in pop_data:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            popular.append({"course_id": course.id, "title": course.title, "count": cnt})

    return {
        "completed_courses": completed,
        "in_progress_courses": in_progress,
        "total_courses": total_courses,
        "exam_count": exam_count,
        "avg_score": avg_score,
        "recent_exams": recent_exams,
        "recent_courses": recent_courses,
        "popular_courses": popular,
    }

@router.get("/personal")
def personal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).order_by(ExamSubmission.submit_time.asc()).all()

    # Trend data
    trend = []
    for s in submissions:
        trend.append({
            "exam_title": s.exam.title[:20],
            "score": s.score,
            "total_score": s.total_score,
            "date": str(s.submit_time)[:10] if s.submit_time else "",
        })

    # Category mastery (radar chart data)
    category_scores = {}
    category_counts = {}
    for s in submissions:
        answers = db.query(ExamAnswer).filter(ExamAnswer.submission_id == s.id).all()
        for a in answers:
            q = a.question
            if q.category_id not in category_scores:
                category_scores[q.category_id] = 0
                category_counts[q.category_id] = 0
            category_scores[q.category_id] += a.score_earned
            category_counts[q.category_id] += q.score

    mastery = []
    from app.models.course import Category
    for cat in db.query(Category).order_by(Category.sort_order).all():
        earned = category_scores.get(cat.id, 0)
        total = category_counts.get(cat.id, 0)
        pct = round(earned / max(total, 1) * 100, 1)
        mastery.append({"category": cat.name, "score": pct})

    # Wrong questions review
    wrong_answers = db.query(ExamAnswer).filter(
        ExamAnswer.submission.has(ExamSubmission.user_id == current_user.id),
        ExamAnswer.is_correct == 0,
    ).order_by(ExamAnswer.id.desc()).limit(50).all()

    wrong_review = []
    for a in wrong_answers:
        q = a.question
        wrong_review.append({
            "question_id": q.id,
            "title": q.title,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "user_answer": a.user_answer,
            "type": q.type,
        })

    return {
        "trend": trend,
        "mastery": mastery,
        "wrong_review": wrong_review,
        "total_exams": len(submissions),
        "avg_score": round(sum(s.score or 0 for s in submissions) / max(len(submissions), 1), 1),
        "max_score": max((s.score or 0 for s in submissions), default=0),
    }

@router.get("/department")
def department_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db.query(User).filter(User.role == "user", User.is_active == 1).count()
    total_exams = db.query(ExamSubmission).filter(ExamSubmission.status == "submitted").count()

    avg_score = db.query(func.avg(ExamSubmission.score)).filter(
        ExamSubmission.status == "submitted"
    ).scalar() or 0

    pass_count = db.query(ExamSubmission).filter(
        ExamSubmission.status == "submitted",
        ExamSubmission.score >= ExamSubmission.pass_score,
    ).count()
    pass_rate = round(pass_count / max(total_exams, 1) * 100, 1)

    # Level stats
    level_stats = []
    for level in ["L1", "L2", "L3"]:
        q_ids = [q.id for q in db.query(Question).filter(Question.level == level).all()]
        if not q_ids:
            continue
        answers = db.query(ExamAnswer).filter(
            ExamAnswer.question_id.in_(q_ids),
            ExamAnswer.submission.has(ExamSubmission.status == "submitted"),
        ).all()
        total = sum(a.score_earned for a in answers)
        max_total = sum(a.question.score for a in answers)
        pct = round(total / max(max_total, 1) * 100, 1)
        level_stats.append({"level": level, "accuracy": pct})

    # Category weakness
    from app.models.course import Category
    cat_stats = []
    for cat in db.query(Category).order_by(Category.sort_order).all():
        q_ids = [q.id for q in db.query(Question).filter(Question.category_id == cat.id).all()]
        if not q_ids:
            continue
        answers = db.query(ExamAnswer).filter(
            ExamAnswer.question_id.in_(q_ids),
            ExamAnswer.submission.has(ExamSubmission.status == "submitted"),
        ).all()
        total = sum(a.score_earned for a in answers)
        max_total = sum(a.question.score for a in answers)
        pct = round(total / max(max_total, 1) * 100, 1)
        cat_stats.append({"category": cat.name, "accuracy": pct})

    return {
        "total_users": total_users,
        "total_exams": total_exams,
        "avg_score": round(avg_score, 1),
        "pass_rate": pass_rate,
        "level_stats": level_stats,
        "category_stats": cat_stats,
    }
```

- [ ] **Step 2: Register in main.py**

```python
from app.routers.stats import router as stats_router
app.include_router(stats_router)
```

- [ ] **Step 3: Commit**

---

### Task 10: Expand Seed Data & Verify Backend

**Files:**
- Modify: `backend/app/seed.py` — expand question bank to ~120 questions

- [ ] **Step 1: Expand get_sample_questions() with full question bank**

Expand the `get_sample_questions()` function to include ~120 questions across all 9 categories and 3 levels, following the distribution:
- L1: 20 single, 10 multi, 10 true_false
- L2: 25 single, 10 multi, 10 true_false
- L3: 20 single, 10 multi, 5 true_false

Each question must include category_id matching the category, appropriate level, and realistic AI/Lingee content.

- [ ] **Step 2: Start backend and verify all endpoints**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

Test login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: returns JWT token and user info

- [ ] **Step 3: Commit**

---

## Phase 3: Frontend Foundation

### Task 11: Vite + React + shadcn/ui Setup

**Files:**
- Create: frontend/ (via Vite scaffold)
- Modify: `frontend/package.json`
- Create: `frontend/src/` structure
- Create: `frontend/components.json` (shadcn config)

- [ ] **Step 1: Scaffold Vite project**

```bash
cd e:/AICode/AIStudyPlantform
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/vite react-router-dom recharts lucide-react axios
npx shadcn@latest init
```

Select: TypeScript, neutral color, CSS variables, yes to all defaults.

- [ ] **Step 3: Configure Vite proxy**

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
```

- [ ] **Step 4: Install shadcn components**

```bash
npx shadcn@latest add button input card label tabs separator dropdown-menu avatar badge progress table select dialog textarea checkbox toast scroll-area sheet
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server running on :5173

- [ ] **Step 6: Commit**

---

### Task 12: API Client, Types & Auth Context

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/useAuth.tsx`
- Create: `frontend/src/pages/Login.tsx`

**Interfaces:**
- Produces:
  - `api` — axios instance with interceptor for auth token
  - TypeScript types: `User`, `Course`, `Category`, `Question`, `Exam`, etc.
  - `AuthProvider` — React context providing `user`, `login()`, `logout()`, `isAdmin`
  - `LoginPage` — form with username/password

- [ ] **Step 1: Write types/index.ts**

```typescript
export interface User {
  id: number;
  username: string;
  real_name: string;
  department: string;
  role: 'user' | 'admin';
  is_active: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface Course {
  id: number;
  title: string;
  category_id: number;
  level: 'L1' | 'L2' | 'L3';
  content: string;
  read_time_minutes: number;
  sort_order: number;
  category?: Category;
  progress_status?: string;
}

export interface Question {
  id: number;
  category_id: number;
  level: string;
  type: 'single' | 'multi' | 'true_false';
  title: string;
  options: string[];
  correct_answer?: string | string[] | boolean;
  score: number;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  pass_score: number;
  total_score: number;
  status: string;
  created_at?: string;
  question_count: number;
  submitted: boolean;
}

export interface ExamTake {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  questions: ExamQuestion[];
  submission_id: number;
  remaining_seconds?: number;
}

export interface ExamQuestion {
  id: number;
  type: string;
  title: string;
  options: string[];
  score: number;
  sort_order: number;
}

export interface ExamResult {
  id: number;
  exam_id: number;
  exam_title: string;
  score: number;
  total_score: number;
  pass_score: number;
  passed: boolean;
  submit_time?: string;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  question_id: number;
  question_title: string;
  question_type: string;
  options: string[];
  correct_answer: string | string[] | boolean;
  user_answer: string | string[] | boolean | null;
  is_correct: boolean | null;
  score_earned: number;
  max_score: number;
}

export interface DashboardStats {
  completed_courses: number;
  in_progress_courses: number;
  total_courses: number;
  exam_count: number;
  avg_score: number;
  recent_exams: { exam_id: number; exam_title: string; score: number; total_score: number; submit_time?: string }[];
  recent_courses: { course_id: number; title: string; status: string; level: string }[];
  popular_courses: { course_id: number; title: string; count: number }[];
}

export interface PersonalStats {
  trend: { exam_title: string; score: number; total_score: number; date: string }[];
  mastery: { category: string; score: number }[];
  wrong_review: { question_id: number; title: string; options: string[]; correct_answer: any; user_answer: any; type: string }[];
  total_exams: number;
  avg_score: number;
  max_score: number;
}

export interface DepartmentStats {
  total_users: number;
  total_exams: number;
  avg_score: number;
  pass_rate: number;
  level_stats: { level: string; accuracy: number }[];
  category_stats: { category: string; accuracy: number }[];
}
```

- [ ] **Step 2: Write lib/api.ts**

```typescript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

- [ ] **Step 3: Write hooks/useAuth.tsx**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then((res) => setUser(res.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 4: Write pages/Login.tsx**

```tsx
import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">AI 研习社</CardTitle>
          <p className="text-center text-muted-foreground text-sm">部门 AI 学习与考核平台</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">登录</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

---

### Task 13: App Layout & Routing

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Write components/Layout.tsx**

Sidebar navigation with:
- Logo "AI 研习社"
- Navigation items: 首页, 学习中心, 考试中心, 成绩分析
- Admin section (conditionally shown): 题库管理, 课程管理, 用户管理, 考试管理, 部门分析
- User info at bottom with logout button

```tsx
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardList, BarChart3, Home, Shield, Users, GraduationCap, FileQuestion, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/courses', icon: BookOpen, label: '学习中心' },
  { to: '/exams', icon: ClipboardList, label: '考试中心' },
  { to: '/stats', icon: BarChart3, label: '成绩分析' },
];

const adminItems = [
  { to: '/admin/questions', icon: FileQuestion, label: '题库管理' },
  { to: '/admin/courses', icon: GraduationCap, label: '课程管理' },
  { to: '/admin/users', icon: Users, label: '用户管理' },
  { to: '/admin/exams', icon: Shield, label: '考试管理' },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  if (!user) return <Outlet />;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">AI 研习社</h1>
          <p className="text-xs text-muted-foreground mt-1">部门 AI 学习平台</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${location.pathname === to ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon size={18} /> {label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase">管理</div>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${location.pathname === to ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon size={18} /> {label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.real_name}</p>
              <p className="text-xs text-muted-foreground">{user.role === 'admin' ? '管理员' : '学员'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/Login';
import HomePage from '@/pages/Home';
import CourseList from '@/pages/CourseList';
import CourseDetail from '@/pages/CourseDetail';
import ExamList from '@/pages/ExamList';
import ExamTake from '@/pages/ExamTake';
import ExamResult from '@/pages/ExamResult';
import PersonalStats from '@/pages/PersonalStats';
import DepartmentStats from '@/pages/DepartmentStats';
import QuestionManage from '@/pages/admin/QuestionManage';
import CourseManage from '@/pages/admin/CourseManage';
import UserManage from '@/pages/admin/UserManage';
import ExamManage from '@/pages/admin/ExamManage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
            <Route path="/exams/:id" element={<ProtectedRoute><ExamTake /></ProtectedRoute>} />
            <Route path="/exams/:id/result" element={<ProtectedRoute><ExamResult /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><PersonalStats /></ProtectedRoute>} />
            <Route path="/stats/department" element={<AdminRoute><DepartmentStats /></AdminRoute>} />
            <Route path="/admin/questions" element={<AdminRoute><QuestionManage /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><CourseManage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManage /></AdminRoute>} />
            <Route path="/admin/exams" element={<AdminRoute><ExamManage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Write main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 4: Create placeholder page files**

Create skeleton files for each page (just returning a div with the page name) so the app compiles.

- [ ] **Step 5: Verify app compiles**

```bash
cd frontend && npm run dev
```

- [ ] **Step 6: Commit**

---

## Phase 4: Frontend Pages

### Task 14: Home Page

**Files:**
- Create: `frontend/src/pages/Home.tsx`

- [ ] **Step 1: Write pages/Home.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, TrendingUp, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/stats/dashboard').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">👋 欢迎回来，{user?.real_name}！</h2>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">已学课程</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><BookOpen size={20} className="text-primary" /><span className="text-2xl font-bold">{stats.completed_courses}</span><span className="text-muted-foreground text-sm">/ {stats.total_courses}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">考试次数</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><ClipboardList size={20} className="text-primary" /><span className="text-2xl font-bold">{stats.exam_count}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">平均得分</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><TrendingUp size={20} className="text-primary" /><span className="text-2xl font-bold">{stats.avg_score}</span><span className="text-muted-foreground text-sm">分</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><BookOpen size={20} className="text-orange-500" /><span className="text-2xl font-bold">{stats.in_progress_courses}</span></div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>📚 继续学习</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.recent_courses.map((c) => (
              <Link key={c.course_id} to={`/courses/${c.course_id}`} className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{c.title}</span>
                  <Badge variant={c.status === 'completed' ? 'default' : 'secondary'}>
                    {c.status === 'completed' ? '已完成' : c.status === 'in_progress' ? '进行中' : '未开始'}
                  </Badge>
                </div>
                <Progress value={c.status === 'completed' ? 100 : c.status === 'in_progress' ? 50 : 0} className="mt-2 h-1" />
              </Link>
            ))}
            {stats.recent_courses.length === 0 && <p className="text-muted-foreground text-sm">暂无学习记录</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📝 近期考试</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.recent_exams.map((e) => (
              <div key={e.exam_id} className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">{e.exam_title}</span>
                <Badge variant={e.score >= 60 ? 'default' : 'destructive'}>
                  {e.score} / {e.total_score}
                </Badge>
              </div>
            ))}
            {stats.recent_exams.length === 0 && <p className="text-muted-foreground text-sm">暂无考试记录</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>🔥 热门课程</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.popular_courses.map((c) => (
              <Link key={c.course_id} to={`/courses/${c.course_id}`} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                <span>{c.title}</span>
                <Badge variant="outline">{c.count} 人已学</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 15: Course Pages

**Files:**
- Create: `frontend/src/pages/CourseList.tsx`
- Create: `frontend/src/pages/CourseDetail.tsx`

- [ ] **Step 1: Write CourseList.tsx**

Course list with filter tabs (category, level), course cards showing title, category, level badge, progress status.

- [ ] **Step 2: Write CourseDetail.tsx**

Course detail page with:
- Markdown content renderer (use a simple approach: convert markdown to HTML client-side, or use `react-markdown` package)
- Course info sidebar (category, level, read time)
- "Mark as completed" button
- Associated practice questions (fetch from `/api/questions?category_id=X&level=Y`)

Install react-markdown:
```bash
npm install react-markdown
```

- [ ] **Step 3: Commit**

---

### Task 16: Exam Pages (User)

**Files:**
- Create: `frontend/src/pages/ExamList.tsx`
- Create: `frontend/src/pages/ExamTake.tsx`
- Create: `frontend/src/pages/ExamResult.tsx`

- [ ] **Step 1: Write ExamList.tsx**

List published exams with: title, question count, time limit, pass score, submitted status. Click to start exam.

- [ ] **Step 2: Write ExamTake.tsx**

Exam taking page with:
- Countdown timer (auto-submit on timeout)
- Question navigation sidebar (numbered cards with answered/marked status)
- Current question display (rendered based on type: single/multi/true_false)
- Multi-select uses checkboxes, single uses radio buttons, true_false uses toggle
- "Submit" button with confirmation dialog showing unanswered count

- [ ] **Step 3: Write ExamResult.tsx**

Result page showing:
- Score card (score/total, passed/failed badge)
- Per-question breakdown (question, your answer, correct answer, score)
- Link back to exam list

- [ ] **Step 4: Commit**

---

### Task 17: Stats Pages

**Files:**
- Create: `frontend/src/pages/PersonalStats.tsx`
- Create: `frontend/src/pages/DepartmentStats.tsx`

- [ ] **Step 1: Write PersonalStats.tsx**

Personal analytics page with:
- Summary cards (total exams, avg score, max score)
- Score trend line chart (Recharts LineChart)
- Category mastery radar chart (Recharts RadarChart)
- Wrong question review list (expandable to see question + correct answer)

Install Recharts if not already:
```bash
npm install recharts
```

- [ ] **Step 2: Write DepartmentStats.tsx**

Department analytics (admin only) with:
- Summary: total users, total exams, avg score, pass rate
- Level accuracy bar chart (Recharts BarChart)
- Category weakness analysis (sorted list by accuracy)

- [ ] **Step 3: Commit**

---

### Task 18: Admin Pages

**Files:**
- Create: `frontend/src/pages/admin/QuestionManage.tsx`
- Create: `frontend/src/pages/admin/CourseManage.tsx`
- Create: `frontend/src/pages/admin/UserManage.tsx`
- Create: `frontend/src/pages/admin/ExamManage.tsx`

- [ ] **Step 1: Write QuestionManage.tsx**

Question bank management with:
- Filter bar (category, level, type, search)
- Table/list of questions showing: title (truncated), type badge, level badge, score
- Add/Edit dialog:
  - Question type selector (changes option input layout)
  - Single choice: 4 text inputs for options, radio to select correct
  - Multi choice: 4-6 text inputs, checkboxes for correct answers
  - True/False: just the statement, radio for correct (True/False)
- Delete with confirmation
- Category and level dropdowns

- [ ] **Step 2: Write CourseManage.tsx**

Course management with:
- Course list table
- Add/Edit dialog with: title, category select, level select, content textarea (markdown), read time
- Delete confirmation

- [ ] **Step 3: Write UserManage.tsx**

User management with:
- User table: username, real_name, department, role, status
- Add user dialog: username, password, real_name, department, role select
- Edit user dialog (no password change here, admin can toggle active status)
- Delete with "last admin" protection

- [ ] **Step 4: Write ExamManage.tsx**

Exam management with:
- Create exam form:
  - Title, description, time limit, pass score
  - Question selector: browse questions by category/level, check to select
  - Preview selected questions + auto-calculated total score
- Published exams list
- View exam results (all user submissions)

- [ ] **Step 5: Commit**

---

### Task 19: Polish & Integration

**Files:**
- Various frontend pages — polish UI, fix bugs
- `backend/app/main.py` — static file serving for production

- [ ] **Step 1: Production static serving**

In `backend/app/main.py`, add after routes:
```python
from fastapi.staticfiles import StaticFiles
import os

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
```

- [ ] **Step 2: Add README.md**

Write project README with:
- Project description
- How to run (backend + frontend)
- Default admin credentials
- Tech stack overview
- Database location

- [ ] **Step 3: Full integration test**

1. Start backend: `cd backend && uvicorn app.main:app --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Test flow: Login as admin → Browse courses → Take exam → View results → Create questions → Create exam
4. Test flow: Login as normal user → Browse courses → Take exam → View stats

- [ ] **Step 4: Build frontend for production**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

---

## Verification Checklist

After all tasks are complete, verify:

1. [ ] Backend starts clean: `cd backend && uvicorn app.main:app --port 8000`
2. [ ] Admin login works: POST `/api/auth/login` with admin/admin123
3. [ ] All seed data present: ~120 questions, 15 courses, 9 categories
4. [ ] Regular user login works
5. [ ] Course browsing and filtering works
6. [ ] Course completion tracking works
7. [ ] Question CRUD works (admin)
8. [ ] Exam creation with question selection works (admin)
9. [ ] Exam taking with countdown works
10. [ ] Auto-grading produces correct scores for single/multi/true_false
11. [ ] Personal stats display trend chart and radar chart
12. [ ] Department stats display for admin
13. [ ] Frontend production build succeeds
