import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardStats } from '@/types';

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => { api.get('/stats/dashboard').then((res) => setStats(res.data)); }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const levelColors: Record<string, string> = { L1: 'bg-green-100 text-green-700', L2: 'bg-yellow-100 text-yellow-700', L3: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900">👋 欢迎回来，{user?.real_name}！</h2>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: '📚', label: '已学课程', value: stats.completed_courses, sub: `/ ${stats.total_courses}`, color: 'bg-blue-50' },
          { icon: '📝', label: '考试次数', value: stats.exam_count, sub: '', color: 'bg-green-50' },
          { icon: '📈', label: '平均得分', value: stats.avg_score, sub: '分', color: 'bg-purple-50' },
          { icon: '🔄', label: '进行中', value: stats.in_progress_courses, sub: '', color: 'bg-orange-50' },
        ].map(({ icon, label, value, sub, color }) => (
          <div key={label} className={`${color} rounded-xl p-4`}>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{value}</span>
              {sub && <span className="text-sm text-gray-400">{sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📚 继续学习</h3>
          <div className="space-y-2">
            {stats.recent_courses.map((c) => (
              <Link key={c.course_id} to={`/courses/${c.course_id}`} className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 text-sm">{c.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'completed' ? '已完成' : c.status === 'in_progress' ? '进行中' : '未开始'}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                  <div className={`h-1 rounded-full ${c.status === 'completed' ? 'bg-green-500 w-full' : c.status === 'in_progress' ? 'bg-blue-500 w-1/2' : 'w-0'}`} />
                </div>
              </Link>
            ))}
            {stats.recent_courses.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">暂无学习记录，快去学习吧！</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📝 近期考试</h3>
          <div className="space-y-2">
            {stats.recent_exams.map((e) => (
              <div key={e.exam_id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                <span className="font-medium text-gray-800 text-sm">{e.exam_title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(e.score || 0) >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {e.score} / {e.total_score}
                </span>
              </div>
            ))}
            {stats.recent_exams.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">暂无考试记录</p>}
          </div>
        </div>
      </div>

      {stats.popular_courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">🔥 热门课程</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.popular_courses.map((c) => (
              <Link key={c.course_id} to={`/courses/${c.course_id}`} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-800">{c.title}</span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{c.count} 人已学</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
