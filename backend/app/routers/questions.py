from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.question import Question
from app.schemas.question import QuestionOut, QuestionListOut, QuestionCreate, QuestionUpdate
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("", response_model=list[QuestionListOut])
def list_questions(
    category_id: int | None = Query(None),
    level: str | None = Query(None),
    type: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question)
    if category_id:
        q = q.filter(Question.category_id == category_id)
    if level:
        q = q.filter(Question.level == level)
    if type:
        q = q.filter(Question.type == type)
    if search:
        q = q.filter(Question.title.contains(search))
    return q.order_by(Question.id.desc()).limit(200).all()

@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionOut.model_validate(question)

@router.post("", response_model=QuestionOut)
def create_question(
    body: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = Question(**body.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return QuestionOut.model_validate(question)

@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    body: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(question, key, val)
    db.commit()
    db.refresh(question)
    return QuestionOut.model_validate(question)

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return {"message": "Question deleted"}
