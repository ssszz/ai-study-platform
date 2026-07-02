from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.course import Category, Course, CourseProgress
from app.models.question import Question
from app.models.exam import ExamSubmission, ExamAnswer
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completed = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.status == "completed",
    ).count()
    in_progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.status == "in_progress",
    ).count()
    total_courses = db.query(Course).count()

    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).all()

    exam_count = len(submissions)
    avg_score = round(sum(s.score or 0 for s in submissions) / max(exam_count, 1), 1)

    recent_exams = []
    for s in sorted(submissions, key=lambda x: x.submit_time or "", reverse=True)[:5]:
        recent_exams.append({
            "exam_id": s.exam_id,
            "exam_title": s.exam.title,
            "score": s.score,
            "total_score": s.total_score,
            "submit_time": str(s.submit_time) if s.submit_time else None,
        })

    recent_courses = []
    progresses = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
    ).order_by(CourseProgress.id.desc()).limit(5).all()
    for p in progresses:
        course = db.query(Course).filter(Course.id == p.course_id).first()
        if course:
            recent_courses.append({
                "course_id": course.id,
                "title": course.title,
                "status": p.status,
                "level": course.level,
            })

    popular = []
    pop_data = db.query(
        CourseProgress.course_id,
        func.count(CourseProgress.id).label("cnt")
    ).filter(CourseProgress.status == "completed").group_by(
        CourseProgress.course_id
    ).order_by(func.count(CourseProgress.id).desc()).limit(5).all()
    for course_id, cnt in pop_data:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            popular.append({"course_id": course.id, "title": course.title, "count": cnt})

    return {
        "completed_courses": completed,
        "in_progress_courses": in_progress,
        "total_courses": total_courses,
        "exam_count": exam_count,
        "avg_score": avg_score,
        "recent_exams": recent_exams,
        "recent_courses": recent_courses,
        "popular_courses": popular,
    }

@router.get("/personal")
def personal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.user_id == current_user.id,
        ExamSubmission.status == "submitted",
    ).order_by(ExamSubmission.submit_time.asc()).all()

    trend = []
    for s in submissions:
        trend.append({
            "exam_title": s.exam.title[:20],
            "score": s.score,
            "total_score": s.total_score,
            "date": str(s.submit_time)[:10] if s.submit_time else "",
        })

    category_scores = {}
    category_counts = {}
    for s in submissions:
        answers = db.query(ExamAnswer).filter(ExamAnswer.submission_id == s.id).all()
        for a in answers:
            q = a.question
            if q.category_id not in category_scores:
                category_scores[q.category_id] = 0
                category_counts[q.category_id] = 0
            category_scores[q.category_id] += a.score_earned
            category_counts[q.category_id] += q.score

    mastery = []
    for cat in db.query(Category).order_by(Category.sort_order).all():
        earned = category_scores.get(cat.id, 0)
        total = category_counts.get(cat.id, 0)
        pct = round(earned / max(total, 1) * 100, 1)
        mastery.append({"category": cat.name, "score": pct})

    wrong_answers = db.query(ExamAnswer).filter(
        ExamAnswer.submission.has(ExamSubmission.user_id == current_user.id),
        ExamAnswer.is_correct == 0,
    ).order_by(ExamAnswer.id.desc()).limit(50).all()

    wrong_review = []
    for a in wrong_answers:
        q = a.question
        wrong_review.append({
            "question_id": q.id,
            "title": q.title,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "user_answer": a.user_answer,
            "type": q.type,
        })

    return {
        "trend": trend,
        "mastery": mastery,
        "wrong_review": wrong_review,
        "total_exams": len(submissions),
        "avg_score": round(sum(s.score or 0 for s in submissions) / max(len(submissions), 1), 1),
        "max_score": max((s.score or 0 for s in submissions), default=0),
    }

@router.get("/department")
def department_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total_users = db.query(User).filter(User.role == "user", User.is_active == 1).count()
    total_exams = db.query(ExamSubmission).filter(ExamSubmission.status == "submitted").count()

    avg_score = db.query(func.avg(ExamSubmission.score)).filter(
        ExamSubmission.status == "submitted"
    ).scalar() or 0

    pass_count = db.query(ExamSubmission).filter(
        ExamSubmission.status == "submitted",
        ExamSubmission.score >= ExamSubmission.pass_score,
    ).count()
    pass_rate = round(pass_count / max(total_exams, 1) * 100, 1)

    level_stats = []
    for level in ["L1", "L2", "L3"]:
        q_ids = [q.id for q in db.query(Question).filter(Question.level == level).all()]
        if not q_ids:
            continue
        answers = db.query(ExamAnswer).filter(
            ExamAnswer.question_id.in_(q_ids),
            ExamAnswer.submission.has(ExamSubmission.status == "submitted"),
        ).all()
        total = sum(a.score_earned for a in answers)
        max_total = sum(a.question.score for a in answers)
        pct = round(total / max(max_total, 1) * 100, 1)
        level_stats.append({"level": level, "accuracy": pct})

    cat_stats = []
    for cat in db.query(Category).order_by(Category.sort_order).all():
        q_ids = [q.id for q in db.query(Question).filter(Question.category_id == cat.id).all()]
        if not q_ids:
            continue
        answers = db.query(ExamAnswer).filter(
            ExamAnswer.question_id.in_(q_ids),
            ExamAnswer.submission.has(ExamSubmission.status == "submitted"),
        ).all()
        total = sum(a.score_earned for a in answers)
        max_total = sum(a.question.score for a in answers)
        pct = round(total / max(max_total, 1) * 100, 1)
        cat_stats.append({"category": cat.name, "accuracy": pct})

    return {
        "total_users": total_users,
        "total_exams": total_exams,
        "avg_score": round(avg_score, 1),
        "pass_rate": pass_rate,
        "level_stats": level_stats,
        "category_stats": cat_stats,
    }
