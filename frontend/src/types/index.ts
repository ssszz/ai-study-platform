export interface User {
  id: number;
  username: string;
  real_name: string;
  department: string;
  role: 'user' | 'admin';
  is_active: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface Course {
  id: number;
  title: string;
  category_id: number;
  level: 'L1' | 'L2' | 'L3';
  content: string;
  read_time_minutes: number;
  sort_order: number;
  category?: Category;
  progress_status?: string;
}

export interface Question {
  id: number;
  category_id: number;
  level: string;
  type: 'single' | 'multi' | 'true_false';
  title: string;
  options: string[];
  correct_answer?: string | string[] | boolean;
  score: number;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  pass_score: number;
  total_score: number;
  status: string;
  created_at?: string;
  question_count: number;
  submitted: boolean;
}

export interface ExamTake {
  id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  questions: ExamQuestion[];
  submission_id: number;
  remaining_seconds?: number;
}

export interface ExamQuestion {
  id: number;
  type: string;
  title: string;
  options: string[];
  score: number;
  sort_order: number;
}

export interface ExamResult {
  id: number;
  exam_id: number;
  exam_title: string;
  score: number;
  total_score: number;
  pass_score: number;
  passed: boolean;
  submit_time?: string;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  question_id: number;
  question_title: string;
  question_type: string;
  options: string[];
  correct_answer: string | string[] | boolean;
  user_answer: string | string[] | boolean | null;
  is_correct: boolean | null;
  score_earned: number;
  max_score: number;
}

export interface DashboardStats {
  completed_courses: number;
  in_progress_courses: number;
  total_courses: number;
  exam_count: number;
  avg_score: number;
  recent_exams: { exam_id: number; exam_title: string; score: number; total_score: number; submit_time?: string }[];
  recent_courses: { course_id: number; title: string; status: string; level: string }[];
  popular_courses: { course_id: number; title: string; count: number }[];
}

export interface PersonalStats {
  trend: { exam_title: string; score: number; total_score: number; date: string }[];
  mastery: { category: string; score: number }[];
  wrong_review: { question_id: number; title: string; options: string[]; correct_answer: string | string[] | boolean; user_answer: string | string[] | boolean | null; type: string }[];
  total_exams: number;
  avg_score: number;
  max_score: number;
}

export interface DepartmentStats {
  total_users: number;
  total_exams: number;
  avg_score: number;
  pass_rate: number;
  level_stats: { level: string; accuracy: number }[];
  category_stats: { category: string; accuracy: number }[];
}
