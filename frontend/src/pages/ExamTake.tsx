import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { ExamTake, ExamQuestion } from '@/types';

export default function ExamTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamTake | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[] | boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/exams/${id}`).then((r) => {
      setExam(r.data);
      setTimeLeft(r.data.remaining_seconds || r.data.time_limit_minutes * 60);
    });
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (q: ExamQuestion, val: string | string[] | boolean) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const handleSubmit = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    const answerList = exam.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? null,
    }));
    try {
      await api.post(`/exams/${id}/submit`, { submission_id: exam.submission_id, answers: answerList });
      navigate(`/exams/${id}/result`);
    } catch {
      setSubmitting(false);
    }
  };

  if (!exam) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const q = exam.questions[currentIdx];
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const unanswered = exam.questions.filter((q) => answers[q.id] === undefined || answers[q.id] === null || (Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)).length;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-900">{exam.title}</h2>
          <p className="text-xs text-gray-400">{exam.questions.length} 题 · 总分通过自动评分</p>
        </div>
        <div className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">第 {currentIdx + 1}/{exam.questions.length} 题</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{q.type === 'single' ? '单选题' : q.type === 'multi' ? '多选题' : '判断题'}</span>
            <span className="text-xs text-gray-400">{q.score} 分</span>
          </div>

          <h3 className="font-medium text-gray-900 mb-4">{q.title}</h3>

          <div className="space-y-2">
            {q.type === 'true_false' ? (
              <div className="flex gap-4">
                {[{ v: true, l: '✅ 正确' }, { v: false, l: '❌ 错误' }].map(({ v, l }) => (
                  <label key={String(v)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === v} onChange={() => handleAnswer(q, v)} className="text-blue-600" />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
            ) : q.type === 'single' ? (
              q.options.map((opt) => (
                <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt[0] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name={`q-${q.id}`} value={opt[0]} checked={answers[q.id] === opt[0]} onChange={() => handleAnswer(q, opt[0])} className="text-blue-600" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))
            ) : (
              q.options.map((opt) => (
                <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${(answers[q.id] as string[] || []).includes(opt[0]) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={(answers[q.id] as string[] || []).includes(opt[0])} onChange={(e) => {
                    const cur = (answers[q.id] as string[]) || [];
                    handleAnswer(q, e.target.checked ? [...cur, opt[0]] : cur.filter((v) => v !== opt[0]));
                  }} className="text-blue-600 rounded" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="w-48 shrink-0 space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">答题卡</h4>
            <div className="grid grid-cols-5 gap-1.5">
              {exam.questions.map((eq, i) => (
                <button key={eq.id} onClick={() => setCurrentIdx(i)}
                  className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                    i === currentIdx ? 'ring-2 ring-blue-500 bg-blue-600 text-white' :
                    answers[eq.id] !== undefined && answers[eq.id] !== null && !(Array.isArray(answers[eq.id]) && (answers[eq.id] as string[]).length === 0)
                    ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex justify-between mb-2">
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-300">上一题</button>
              <button onClick={() => setCurrentIdx(Math.min(exam.questions.length - 1, currentIdx + 1))} disabled={currentIdx === exam.questions.length - 1}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-300">下一题</button>
            </div>
            <button onClick={() => {
              if (unanswered > 0) {
                if (!window.confirm(`还有 ${unanswered} 道题未作答，确定交卷吗？`)) return;
              } else {
                if (!window.confirm('确定交卷吗？交卷后无法修改答案。')) return;
              }
              handleSubmit();
            }} disabled={submitting}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
              {submitting ? '提交中...' : '交卷'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
