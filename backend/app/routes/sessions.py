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
    """Initializes a new mock interview session with the specified topic and difficulty."""
    topic_cleaned = payload.topic.strip()
    if topic_cleaned not in ["Python", "DSA", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic must be one of: 'Python', 'DSA', or 'HR'"
        )

    difficulty_cleaned = (payload.difficulty or "Medium").strip()
    if difficulty_cleaned not in ["Easy", "Medium", "Hard"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be one of: 'Easy', 'Medium', or 'Hard'"
        )

    session = InterviewSession(
        topic=topic_cleaned,
        difficulty=difficulty_cleaned,
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
    """Computes the overall average score, generates a summary using Gemini, and completes the session."""
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID {session_id} not found."
        )
    
    if session.is_completed:
        return session

    # Retrieve all questions associated with this session
    statement = select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
    questions = db.exec(statement).all()
    
    evaluated_questions = [q for q in questions if q.score is not None]
    overall_score = 0.0
    summary = "No questions were completed during this session."
    
    if evaluated_questions:
        # Compute the average score
        total_score = sum(q.score for q in evaluated_questions)
        overall_score = float(total_score) / len(evaluated_questions)
        
        try:
            gemini = GeminiService()
            # Compile a multi-question evaluation history
            history_summary = "\n".join(
                [f"Q: {q.question_text}\nScore: {q.score}/100\nFeedback: {q.feedback}" for q in evaluated_questions]
            )
            summary = gemini.generate_summary(
                question="Multi-Question Interview Session",
                answer="Candidate completed multiple questions in this track.",
                score=int(overall_score),
                feedback=history_summary
            )
        except Exception as e:
            summary = f"Interview completed. Candidate answered {len(evaluated_questions)} questions with an average score of {int(overall_score)}/100."
    else:
        if questions:
            summary = "Questions were generated but not answered or evaluated."
        else:
            summary = "No questions were generated for this session."

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
    
    result = []
    for s in sessions:
        result.append(
            SessionResponse(
                id=s.id,
                topic=s.topic,
                difficulty=s.difficulty,
                question_count=len(s.questions),
                created_at=s.created_at,
                overall_score=s.overall_score,
                summary=s.summary,
                is_completed=s.is_completed
            )
        )
    return result


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


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an interview session and all its questions"
)
def delete_session(session_id: int, db: Session = Depends(get_session)):
    """Deletes the specified interview session and all associated questions from the database."""
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID {session_id} not found."
        )
    
    # Deleting the session automatically cascade deletes related questions
    db.delete(session)
    db.commit()
    return {"status": "success", "message": f"Interview session {session_id} deleted successfully."}
