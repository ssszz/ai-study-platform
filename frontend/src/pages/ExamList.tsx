import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Exam } from '@/types';

export default function ExamList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exams').then((r) => { setExams(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📝 考试中心</h2>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">暂无可用考试</p>
          <p className="text-gray-300 text-sm mt-2">请联系管理员创建考试</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{exam.title}</h3>
                  {exam.description && <p className="text-sm text-gray-400 mt-1">{exam.description}</p>}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>📋 {exam.question_count} 题</span>
                    <span>⏱ {exam.time_limit_minutes} 分钟</span>
                    <span>📊 及格线：{exam.pass_score} 分</span>
                    <span>📈 总分：{exam.total_score} 分</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exam.submitted ? (
                    <button onClick={() => navigate(`/exams/${exam.id}/result`)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      查看成绩
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/exams/${exam.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      开始考试
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
