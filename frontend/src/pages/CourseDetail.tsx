import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/api';
import type { Course, Question } from '@/types';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'practice'>('content');
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`).then((r) => {
      setCourse(r.data);
      api.get(`/questions?category_id=${r.data.category_id}&level=${r.data.level}&limit=5`).then((q) => setQuestions(q.data.slice(0, 5)));
    });
  }, [id]);

  const handleMarkComplete = async () => {
    await api.post(`/courses/${id}/complete`);
    setCourse((prev) => prev ? { ...prev, progress_status: 'completed' } : prev);
  };

  const handleAnswer = (qid: number, val: string | string[]) => {
    if (!submitted) setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const checkAnswer = (q: Question) => {
    const user = answers[q.id];
    if (!user) return null;
    if (q.type === 'multi') {
      const correct = q.correct_answer as string[];
      const userArr = Array.isArray(user) ? user : [user];
      return JSON.stringify([...userArr].sort()) === JSON.stringify([...correct].sort());
    }
    if (q.type === 'true_false') return Boolean(user) === Boolean(q.correct_answer);
    return String(user).toUpperCase() === String(q.correct_answer).toUpperCase();
  };

  if (!course) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← 返回</button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
          <span>{course.category?.name}</span>
          <span>⏱ {course.read_time_minutes}分钟</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${course.level === 'L1' ? 'bg-green-100 text-green-700' : course.level === 'L2' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {course.level === 'L1' ? '入门' : course.level === 'L2' ? '进阶' : '高级'}
          </span>
        </div>

        <div className="flex gap-4 mb-4 border-b border-gray-100">
          <button onClick={() => setActiveTab('content')}
            className={`pb-2 px-1 text-sm border-b-2 transition-colors ${activeTab === 'content' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-400'}`}>
            课程内容
          </button>
          {questions.length > 0 && (
            <button onClick={() => setActiveTab('practice')}
              className={`pb-2 px-1 text-sm border-b-2 transition-colors ${activeTab === 'practice' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-400'}`}>
              课后练习 ({questions.length})
            </button>
          )}
        </div>

        {activeTab === 'content' ? (
          <>
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{course.content}</ReactMarkdown>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {course.progress_status === 'completed' ? '✅ 已完成' : course.progress_status === 'in_progress' ? '📖 进行中' : '未开始'}
              </span>
              {course.progress_status !== 'completed' && (
                <button onClick={handleMarkComplete} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  标记为已完成
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.title}</p>
                <div className="space-y-1.5">
                  {q.type === 'true_false' ? (
                    <div className="flex gap-4">
                      {['true', 'false'].map((v) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={`q-${q.id}`} value={v} checked={answers[q.id] === v} onChange={() => handleAnswer(q.id, v)} disabled={submitted} className="text-blue-600" />
                          <span className="text-sm text-gray-700">{v === 'true' ? '正确 ✅' : '错误 ❌'}</span>
                        </label>
                      ))}
                    </div>
                  ) : q.type === 'single' ? (
                    (q.options as string[]).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`q-${q.id}`} value={opt[0]} checked={answers[q.id] === opt[0]} onChange={() => handleAnswer(q.id, opt[0])} disabled={submitted} className="text-blue-600" />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))
                  ) : (
                    (q.options as string[]).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value={opt[0]} checked={(answers[q.id] as string[] || []).includes(opt[0])} onChange={(e) => {
                          const cur = (answers[q.id] as string[]) || [];
                          handleAnswer(q.id, e.target.checked ? [...cur, opt[0]] : cur.filter((v) => v !== opt[0]));
                        }} disabled={submitted} className="text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))
                  )}
                </div>
                {submitted && (
                  <p className={`mt-2 text-sm ${checkAnswer(q) ? 'text-green-600' : 'text-red-600'}`}>
                    {checkAnswer(q) ? '✅ 正确' : `❌ 错误，正确答案：${Array.isArray(q.correct_answer) ? (q.correct_answer as string[]).join(', ') : q.correct_answer}`}
                  </p>
                )}
              </div>
            ))}
            {!submitted && (
              <button onClick={() => setSubmitted(true)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                提交练习
              </button>
            )}
            {submitted && (
              <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                重新练习
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
