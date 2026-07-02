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
