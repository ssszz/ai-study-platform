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
