import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import type { ExamResult } from '@/types';

export default function ExamResult() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    api.get(`/exams/${id}/result`).then((r) => setResults(r.data));
  }, [id]);

  if (results.length === 0) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const latest = results[results.length - 1];

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 考试成绩</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className={`text-6xl font-bold mb-2 ${latest.passed ? 'text-green-600' : 'text-red-600'}`}>{latest.score}</div>
        <p className="text-gray-400 mb-1">总分：{latest.total_score} · 及格线：{latest.pass_score}</p>
        {latest.passed ? (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✅ 通过</span>
        ) : (
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">❌ 未通过</span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">答题详情</h3>
        <div className="space-y-3">
          {latest.answers.map((a, i) => (
            <div key={a.question_id} className={`p-4 rounded-lg border ${a.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-gray-900 text-sm flex-1">{i + 1}. {a.question_title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${a.is_correct ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                  {a.score_earned}/{a.max_score} 分
                </span>
              </div>
              <div className="text-xs space-y-1">
                {a.question_type === 'true_false' ? (
                  <>
                    <p><span className="text-gray-500">你的答案：</span><span className={a.is_correct ? 'text-green-600' : 'text-red-600'}>{String(a.user_answer) === 'true' ? '正确 ✅' : '错误 ❌'}</span></p>
                    {!a.is_correct && <p><span className="text-gray-500">正确答案：</span><span className="text-green-600">{String(a.correct_answer) === 'true' ? '正确 ✅' : '错误 ❌'}</span></p>}
                  </>
                ) : (
                  <>
                    <p><span className="text-gray-500">你的答案：</span><span className={a.is_correct ? 'text-green-600' : 'text-red-600'}>{Array.isArray(a.user_answer) ? (a.user_answer as string[]).join(', ') : String(a.user_answer ?? '未作答')}</span></p>
                    {!a.is_correct && <p><span className="text-gray-500">正确答案：</span><span className="text-green-600">{Array.isArray(a.correct_answer) ? (a.correct_answer as string[]).join(', ') : String(a.correct_answer)}</span></p>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
