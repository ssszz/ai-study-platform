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

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.courses import router as courses_router
from app.routers.questions import router as questions_router
from app.routers.exams import router as exams_router
from app.routers.stats import router as stats_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(questions_router)
app.include_router(exams_router)
app.include_router(stats_router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from app.seed import init_data
    init_data()

@app.get("/api/health")
def health():
    return {"status": "ok"}

# Production: serve frontend static files
import os
from fastapi.staticfiles import StaticFiles

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
