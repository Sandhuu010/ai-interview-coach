from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from dotenv import load_dotenv

# Load environment variables on startup
load_dotenv()

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

@app.on_event("startup")
def on_startup():
    """Triggers table initialization automatically on application load."""
    SQLModel.metadata.create_all(engine)

# Include Prefix-Free Routes
app.include_router(sessions.router)
app.include_router(questions.router)

@app.get("/health", tags=["System"])
def health_check():
    """System status check."""
    return {"status": "healthy"}
