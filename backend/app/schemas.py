from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class SessionCreate(BaseModel):
    """Input payload to create a new session."""
    topic: str = Field(..., description="Topic of the session: 'Python', 'DSA', or 'HR'")

class SessionResponse(BaseModel):
    """Output payload representing a basic session info."""
    id: int
    topic: str
    created_at: datetime
    overall_score: Optional[float] = None
    summary: Optional[str] = None
    is_completed: bool

    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    """Output payload representing a generated question."""
    id: int
    session_id: int
    question_text: str

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    """Input payload containing user response answer text."""
    user_answer: str = Field(..., min_length=1, description="Candidate response text")

class QuestionDetailResponse(BaseModel):
    """Output payload representing a question with its evaluation data."""
    id: int
    session_id: int
    question_text: str
    user_answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class SessionDetailResponse(BaseModel):
    """Output payload containing a session and all its question details."""
    id: int
    topic: str
    created_at: datetime
    overall_score: Optional[float] = None
    summary: Optional[str] = None
    is_completed: bool
    questions: List[QuestionDetailResponse] = []

    class Config:
        from_attributes = True

class EvaluationResponse(BaseModel):
    """Output payload representing an active question's score and evaluation."""
    id: int
    session_id: int
    question_text: str
    user_answer: str
    score: int
    feedback: str
    improvement_suggestions: str

    class Config:
        from_attributes = True
