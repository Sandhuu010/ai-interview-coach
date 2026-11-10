from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from app.database import get_session
from app.models import InterviewSession, InterviewQuestion
from app.schemas import QuestionResponse, AnswerSubmit, EvaluationResponse
from app.services.gemini import GeminiService

router = APIRouter()

@router.post(
    "/sessions/{session_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new question for a session"
)
def generate_session_question(session_id: int, db: Session = Depends(get_session)):
    """Generates a question for the interview session via the Gemini API, supporting multi-round logic."""
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session with ID {session_id} not found."
        )

    if session.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate a question for a completed session."
        )

    # Multi-round behavior: check if the most recent question is unanswered/unscored.
    # If so, return that question. Otherwise, generate a new one.
    statement = select(InterviewQuestion).where(InterviewQuestion.session_id == session_id).order_by(InterviewQuestion.id.desc())
    existing_questions = db.exec(statement).all()
    if existing_questions:
        most_recent = existing_questions[0]
        if most_recent.user_answer is None or most_recent.score is None:
            return most_recent

    try:
        gemini = GeminiService()
        difficulty = session.difficulty or "Medium"
        question_text = gemini.generate_question(session.topic, difficulty)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini API failure during question generation: {str(e)}"
        )

    db_question = InterviewQuestion(
        session_id=session_id,
        question_text=question_text,
        timestamp=datetime.utcnow()
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.post(
    "/questions/{question_id}/answer",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit answer and evaluate"
)
def submit_answer_evaluation(
    question_id: int,
    payload: AnswerSubmit,
    db: Session = Depends(get_session)
):
    """Submits the candidate's answer, invokes Gemini for scoring/critique, and logs results."""
    question = db.get(InterviewQuestion, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview question with ID {question_id} not found."
        )

    session = db.get(InterviewSession, question.session_id)
    if session and session.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit an answer for a completed session."
        )

    user_answer_cleaned = payload.user_answer.strip()
    if not user_answer_cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer content cannot be empty."
        )

    try:
        gemini = GeminiService()
        evaluation = gemini.evaluate_answer(
            question=question.question_text,
            answer=user_answer_cleaned
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini API failure during answer evaluation: {str(e)}"
        )

    # Update database record inside a transaction
    question.user_answer = user_answer_cleaned
    question.score = evaluation["score"]
    question.feedback = evaluation["feedback"]
    question.improvement_suggestions = evaluation["improvement_suggestions"]

    db.add(question)
    db.commit()
    db.refresh(question)

    return EvaluationResponse(
        id=question.id,
        session_id=question.session_id,
        question_text=question.question_text,
        user_answer=question.user_answer,
        score=question.score,
        feedback=question.feedback,
        improvement_suggestions=question.improvement_suggestions
    )
