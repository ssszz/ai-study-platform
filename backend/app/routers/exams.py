from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.models.exam import Exam, ExamQuestion, ExamSubmission, ExamAnswer
from app.schemas.exam import (
    ExamOut, ExamCreate, ExamTakeOut, QuestionForExam,
    SubmitExamRequest, ExamResultOut, AnswerDetail,
)
from app.routers.auth import get_current_user, require_admin
from app.services.exam_service import grade_submission

router = APIRouter(prefix="/api/exams", tags=["exams"])

def build_result(submission: ExamSubmission, db: Session) -> ExamResultOut:
    answers = db.query(ExamAnswer).filter(
        ExamAnswer.submission_id == submission.id
    ).all()

    answer_details = []
    for a in answers:
        q = a.question
        answer_details.append(AnswerDetail(
            question_id=q.id,
            question_title=q.title,
            question_type=q.type,
            options=q.options,
            correct_answer=q.correct_answer,
            user_answer=a.user_answer,
            is_correct=bool(a.is_correct) if a.is_correct is not None else None,
            score_earned=a.score_earned,
            max_score=q.score,
        ))

    exam = submission.exam
    return ExamResultOut(
        id=submission.id,
        exam_id=exam.id,
        exam_title=exam.title,
        score=submission.score or 0,
        total_score=submission.total_score,
        pass_score=exam.pass_score,
        passed=(submission.score or 0) >= exam.pass_score,
        submit_time=str(submission.submit_time) if submission.submit_time else None,
        answers=answer_details,
    )

@router.get("", response_model=list[ExamOut])
def list_exams(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Exam).options(joinedload(Exam.questions))
    if status:
        q = q.filter(Exam.status == status)
    exams = q.order_by(Exam.created_at.desc()).all()

    result = []
    for exam in exams:
        eo = ExamOut(
            id=exam.id,
            title=exam.title,
            description=exam.description,
            time_limit_minutes=exam.time_limit_minutes,
            pass_score=exam.pass_score,
            total_score=exam.total_score,
            status=exam.status,
            created_at=str(exam.created_at) if exam.created_at else None,
            question_count=len(exam.questions),
        )
        sub = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam.id,
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.status == "submitted",
        ).first()
        eo.submitted = sub is not None
        result.append(eo)
    return result

@router.post("", response_model=ExamOut)
def create_exam(
    body: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    questions = db.query(Question).filter(Question.id.in_(body.question_ids)).all()
    total_score = sum(q.score for q in questions)

    exam = Exam(
        title=body.title,
        description=body.description,
        time_limit_minutes=body.time_limit_minutes,
        pass_score=body.pass_score,
        total_score=total_score,
        status="published",
        created_by=current_user.id,
    )
    db.add(exam)
    db.flush()

    for i, qid in enumerate(body.question_ids):
        db.add(ExamQuestion(exam_id=exam.id, question_id=qid, sort_order=i + 1))

    db.commit()
    db.refresh(exam)
    return ExamOut(
        id=exam.id, title=exam.title, description=exam.description,
        time_limit_minutes=exam.time_limit_minutes, pass_score=exam.pass_score,
        total_score=exam.total_score, status=exam.status,
        question_count=len(body.question_ids),
    )

@router.get("/{exam_id}", response_model=ExamTakeOut)
def take_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = db.query(Exam).options(joinedload(Exam.questions)).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.status != "published":
        raise HTTPException(status_code=400, detail="Exam is not available")

    submission = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "in_progress",
    ).first()

    if not submission:
        existing = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam_id,
            ExamSubmission.user_id == current_user.id,
            ExamSubmission.status == "submitted",
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You have already submitted this exam")

        submission = ExamSubmission(
            exam_id=exam_id,
            user_id=current_user.id,
            total_score=exam.total_score,
            status="in_progress",
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    eqs = sorted(exam.questions, key=lambda x: x.sort_order)
    questions = []
    for eq in eqs:
        q = eq.question
        questions.append(QuestionForExam(
            id=q.id, type=q.type, title=q.title,
            options=q.options, score=q.score, sort_order=eq.sort_order,
        ))

    elapsed = (datetime.now(timezone.utc) - submission.start_time.replace(tzinfo=timezone.utc)).total_seconds()
    remaining = max(0, exam.time_limit_minutes * 60 - int(elapsed))

    return ExamTakeOut(
        id=exam.id, title=exam.title, description=exam.description,
        time_limit_minutes=exam.time_limit_minutes,
        questions=questions, submission_id=submission.id,
        remaining_seconds=remaining,
    )

@router.post("/{exam_id}/submit", response_model=ExamResultOut)
def submit_exam(
    exam_id: int,
    body: SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == body.submission_id,
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "in_progress",
    ).first()

    if not submission:
        raise HTTPException(status_code=400, detail="No active submission found")

    for ans in body.answers:
        existing = db.query(ExamAnswer).filter(
            ExamAnswer.submission_id == submission.id,
            ExamAnswer.question_id == ans.question_id,
        ).first()
        if existing:
            existing.user_answer = ans.answer
        else:
            db.add(ExamAnswer(
                submission_id=submission.id,
                question_id=ans.question_id,
                user_answer=ans.answer,
            ))

    db.commit()
    submission.submit_time = datetime.now(timezone.utc)
    db.commit()

    grade_submission(submission.id, db)
    db.refresh(submission)

    return build_result(submission, db)

@router.get("/{exam_id}/result", response_model=list[ExamResultOut])
def get_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).all()
    return [build_result(s, db) for s in submissions]
