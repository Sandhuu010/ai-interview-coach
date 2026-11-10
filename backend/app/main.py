from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables on startup (check parent directories if running inside backend/)
env_path = Path('.') / '.env'
if not env_path.exists():
    env_path = Path('..') / '.env'
env_loaded = load_dotenv(dotenv_path=env_path)
print(f".env loaded: {'Yes' if env_loaded else 'No'}", flush=True)

api_key = os.getenv("GEMINI_API_KEY")
print(f"GEMINI_API_KEY found: {'Yes' if api_key else 'No'}", flush=True)
if api_key:
    # mask the key (show only first 6 characters)
    masked_key = api_key[:6] + "..." if len(api_key) > 6 else "..."
    print(f"Masked key: {masked_key}", flush=True)

from app.database import engine
from app.routes import sessions, questions

app = FastAPI(
    title="AI Interview Coach Backend API",
    description="Prefix-free RESTful endpoints for the AI Interview Coach.",
    version="1.0.0"
)

# Configure CORS Middleware to permit React client queries
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlmodel import Session, text

@app.on_event("startup")
def on_startup():
    """Triggers table initialization automatically on application load and logs status."""
    # 1. Create tables and check/apply table schema upgrades
    try:
        SQLModel.metadata.create_all(engine)
        # Apply lightweight dynamic migration for difficulty column
        from sqlalchemy import inspect
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('interview_session')]
        if 'difficulty' not in columns:
            print("[STARTUP] Migration: Adding 'difficulty' column to interview_session table...")
            with Session(engine) as session:
                session.exec(text("ALTER TABLE interview_session ADD COLUMN difficulty VARCHAR DEFAULT 'Medium'"))
                session.commit()
            print("[STARTUP] Migration: 'difficulty' column added successfully.")
    except Exception as e:
        print(f"[STARTUP] ERROR: Table creation/migration failed: {str(e)}")

    # 2. API key detection check
    pass

    # 3. Database connection check
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        print(f"[STARTUP] Database connection successful using: {engine.url}")
    except Exception as db_err:
        print(f"[STARTUP] ERROR: Database connection failed: {str(db_err)}")

    # 4. Gemini Client initialization check
    try:
        from app.services.gemini import GeminiService
        service = GeminiService()
        print("[STARTUP] Gemini Service client initialized successfully.")
    except Exception as gem_err:
        print(f"[STARTUP] WARNING: Gemini client initialization failed: {str(gem_err)}")

# Include Prefix-Free Routes
app.include_router(sessions.router)
app.include_router(questions.router)

@app.get("/health", tags=["System"])
def health_check():
    """System status check."""
    return {"status": "healthy"}

@app.get("/health/gemini", tags=["System"])
def health_gemini():
    """Health check for Gemini integration, sending 'Say Hello' and returning response."""
    try:
        from app.services.gemini import GeminiService
        service = GeminiService()
        
        response = service._generate_content_with_fallback(
            contents="Say Hello",
            temperature=1.0
        )
        response_text = response.text.strip() if response.text else "No text response returned."
        return {
            "status": "success",
            "response": response_text
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return {
            "status": "error",
            "error_message": str(e),
            "traceback": error_trace
        }
