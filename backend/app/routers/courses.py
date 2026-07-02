from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.course import Category, Course, CourseProgress
from app.schemas.course import CourseOut, CourseCreate, CourseUpdate, CategoryOut
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order).all()

@router.get("", response_model=list[CourseOut])
def list_courses(
    category_id: int | None = Query(None),
    level: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Course).options(joinedload(Course.category))
    if category_id:
        q = q.filter(Course.category_id == category_id)
    if level:
        q = q.filter(Course.level == level)
    courses = q.order_by(Course.sort_order).all()

    progress_map = {}
    if current_user:
        progresses = db.query(CourseProgress).filter(
            CourseProgress.user_id == current_user.id
        ).all()
        progress_map = {p.course_id: p.status for p in progresses}

    result = []
    for c in courses:
        co = CourseOut.model_validate(c)
        co.progress_status = progress_map.get(c.id, "not_started")
        result.append(co)
    return result

@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).options(joinedload(Course.category)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    co = CourseOut.model_validate(course)
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id,
    ).first()
    co.progress_status = progress.status if progress else "not_started"
    return co

@router.post("/{course_id}/complete")
def complete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id,
    ).first()
    if progress:
        progress.status = "completed"
    else:
        progress = CourseProgress(user_id=current_user.id, course_id=course_id, status="completed")
        db.add(progress)
    db.commit()
    return {"message": "Course marked as completed"}

@router.post("", response_model=CourseOut)
def create_course(
    body: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = Course(**body.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)

@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(course, key, val)
    db.commit()
    db.refresh(course)
    return CourseOut.model_validate(course)

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}
