from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from typing import List

from app.database import get_session
from app.models import InterviewSession, InterviewQuestion
from app.schemas import SessionCreate, SessionResponse, SessionDetailResponse
from app.services.gemini import GeminiService

router = APIRouter()

@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new interview session"
)
def create_session(payload: SessionCreate, db: Session = Depends(get_session)):
    """Initializes a new mock interview session with the specified topic."""
    topic_cleaned = payload.topic.strip()
    if topic_cleaned not in ["Python", "DSA", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_420_METHOD_FAILURE, # Wait, let's use standard HTTP status codes
            detail="Topic must be one of: 'Python', 'DSA', or 'HR'"
        )
    
    # Custom status check: let's use 400 Bad Request
    if topic_cleaned not in ["Python", "DSA", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic must be one of: 'Python', 'DSA', or 'HR'"
        )

    session = InterviewSession(
        topic=topic_cleaned,
        created_at=datetime.utcnow(),
        is_completed=False
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/sessions/{session_id}/complete",
    response_model=SessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete an active session and generate a performance summary"
)
def complete_session(session_id: int, db: Session = Depends(get_session)):
    """Computes the overall score, generates a summary using Gemini, and completes the session."""
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID {session_id} not found."
        )
    
    if session.is_completed:
        return session

    # Retrieve the single question for the session
    statement = select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
    questions = db.exec(statement).all()
    
    overall_score = 0.0
    summary = "No questions were completed during this session."
    
    if questions:
        # Check if the single question has been evaluated
        active_question = questions[0]
        if active_question.score is not None:
            overall_score = float(active_question.score)
            try:
                gemini = GeminiService()
                summary = gemini.generate_summary(
                    question=active_question.question_text,
                    answer=active_question.user_answer or "",
                    score=active_question.score,
                    feedback=active_question.feedback or ""
                )
            except Exception as e:
                summary = f"Interview completed. Candidate scored {active_question.score}/100."
        else:
            summary = "The question was generated but not answered or evaluated."
    else:
        summary = "No question was generated for this session."

    session.overall_score = overall_score
    session.summary = summary
    session.is_completed = True
    
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get(
    "/sessions",
    response_model=List[SessionResponse],
    status_code=status.HTTP_200_OK,
    summary="List all interview sessions"
)
def list_sessions(db: Session = Depends(get_session)):
    """Returns a list of all historic interview sessions sorted by creation time."""
    statement = select(InterviewSession).order_by(InterviewSession.created_at.desc())
    sessions = db.exec(statement).all()
    return sessions


@router.get(
    "/sessions/{session_id}",
    response_model=SessionDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve session detailed history"
)
def get_session_detail(session_id: int, db: Session = Depends(get_session)):
    """Retrieves session details and all associated questions/evaluations."""
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID {session_id} not found."
        )
    return session
