def grade_question(question_type: str, correct_answer, user_answer, max_score: int) -> tuple[bool, int]:
    """Returns (is_correct, score_earned)."""
    if user_answer is None:
        return (False, 0)

    if question_type == "true_false":
        # Normalize to boolean: handle bool, int (0/1), and string ("true"/"false")
        def to_bool(v):
            if isinstance(v, bool):
                return v
            if isinstance(v, int):
                return bool(v)
            if isinstance(v, str):
                return v.strip().lower() in ("true", "1", "yes", "对", "正确")
            return bool(v)
        is_correct = to_bool(user_answer) == to_bool(correct_answer)
        return (is_correct, max_score if is_correct else 0)

    elif question_type == "single":
        is_correct = str(user_answer).strip().upper() == str(correct_answer).strip().upper()
        return (is_correct, max_score if is_correct else 0)

    elif question_type == "multi":
        if not isinstance(user_answer, list):
            user_answer = [user_answer]
        correct_set = set(str(a).strip().upper() for a in correct_answer)
        user_set = set(str(a).strip().upper() for a in user_answer)

        correct_count = len(user_set & correct_set)
        wrong_count = len(user_set - correct_set)
        total_correct = len(correct_set)

        if wrong_count > 0:
            return (False, 0)
        elif correct_count == total_correct:
            return (True, max_score)
        elif correct_count > 0:
            return (False, max_score // 2)
        else:
            return (False, 0)

    return (False, 0)
