from sqlalchemy.orm import Session
from app.models.exam import ExamSubmission, ExamAnswer
from app.services.grading_service import grade_question

def grade_submission(submission_id: int, db: Session) -> int:
    submission = db.query(ExamSubmission).filter(ExamSubmission.id == submission_id).first()
    if not submission:
        return 0

    answers = db.query(ExamAnswer).filter(ExamAnswer.submission_id == submission_id).all()
    total = 0

    for answer in answers:
        question = answer.question
        is_correct, score = grade_question(
            question_type=question.type,
            correct_answer=question.correct_answer,
            user_answer=answer.user_answer,
            max_score=question.score,
        )
        answer.is_correct = 1 if is_correct else 0
        answer.score_earned = score
        total += score

    submission.score = total
    submission.status = "submitted"
    db.commit()
    return total
