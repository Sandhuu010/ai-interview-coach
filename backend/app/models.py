from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class InterviewSession(SQLModel, table=True):
    """Represents a mock interview candidate session."""
    __tablename__ = "interview_session"

    id: Optional[int] = Field(default=None, primary_key=True)
    topic: str  # Python, DSA, or HR
    difficulty: Optional[str] = Field(default="Medium") # Easy, Medium, or Hard
    created_at: datetime = Field(default_factory=datetime.utcnow)
    overall_score: Optional[float] = None
    summary: Optional[str] = None
    is_completed: bool = False

    questions: List["InterviewQuestion"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class InterviewQuestion(SQLModel, table=True):
    """Represents the single question generated, answered, and evaluated during a session."""
    __tablename__ = "interview_question"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="interview_session.id")
    question_text: str
    user_answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    session: InterviewSession = Relationship(back_populates="questions")
