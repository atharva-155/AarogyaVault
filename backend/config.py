import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "aarogyavault-secret-key-2024")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aarogyavault")