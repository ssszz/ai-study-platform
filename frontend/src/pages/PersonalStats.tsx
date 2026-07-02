import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { PersonalStats } from '@/types';

export default function PersonalStats() {
  const [stats, setStats] = useState<PersonalStats | null>(null);

  useEffect(() => { api.get('/stats/personal').then((r) => setStats(r.data)); }, []);

  if (!stats) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 成绩分析</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '考试次数', value: stats.total_exams },
          { label: '平均分', value: stats.avg_score },
          { label: '最高分', value: stats.max_score },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">📈 考试趋势</h3>
        {stats.trend.length > 0 ? (
          <div className="space-y-2">
            {stats.trend.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24">{t.date}</span>
                <span className="text-sm text-gray-700 w-32 truncate">{t.exam_title}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${Math.max(2, (t.score / t.total_score) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-12 text-right">{t.score}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 py-4 text-center">暂无考试记录</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">🎯 知识点掌握度</h3>
          {stats.mastery.length > 0 ? (
            <div className="space-y-2">
              {stats.mastery.map((m) => (
                <div key={m.category}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{m.category}</span>
                    <span>{m.score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${m.score >= 60 ? 'bg-green-500' : m.score >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.max(2, m.score)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">暂无数据</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📝 错题本</h3>
          {stats.wrong_review.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.wrong_review.map((w) => (
                <details key={w.question_id} className="border border-gray-200 rounded-lg p-3">
                  <summary className="text-sm text-gray-700 cursor-pointer">{w.title}</summary>
                  <div className="mt-2 text-xs space-y-1">
                    {w.type === 'true_false' ? (
                      <>
                        <p><span className="text-gray-400">你的答案：</span><span className="text-red-600">{String(w.user_answer) === 'true' ? '正确' : '错误'}</span></p>
                        <p><span className="text-gray-400">正确答案：</span><span className="text-green-600">{String(w.correct_answer) === 'true' ? '正确' : '错误'}</span></p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-gray-400">你的答案：</span><span className="text-red-600">{Array.isArray(w.user_answer) ? (w.user_answer as string[]).join(', ') : String(w.user_answer)}</span></p>
                        <p><span className="text-gray-400">正确答案：</span><span className="text-green-600">{Array.isArray(w.correct_answer) ? (w.correct_answer as string[]).join(', ') : String(w.correct_answer)}</span></p>
                      </>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">暂无错题，继续保持！</p>}
        </div>
      </div>
    </div>
  );
}
