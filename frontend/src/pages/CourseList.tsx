import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Course, Category } from '@/types';

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat) params.set('category_id', String(filterCat));
    if (filterLevel) params.set('level', filterLevel);
    api.get(`/courses?${params}`).then((r) => { setCourses(r.data); setLoading(false); });
  }, [filterCat, filterLevel]);

  const levelBadge = (l: string) => {
    const m: Record<string, string> = { L1: 'bg-green-100 text-green-700', L2: 'bg-yellow-100 text-yellow-700', L3: 'bg-red-100 text-red-700' };
    return m[l] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📚 学习中心</h2>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat(null)} className={`px-3 py-1.5 rounded-full text-sm ${!filterCat ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>全部</button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${filterCat === cat.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{cat.name}</button>
        ))}
      </div>

      <div className="flex gap-2">
        {['L1', 'L2', 'L3'].map((l) => (
          <button key={l} onClick={() => setFilterLevel(filterLevel === l ? null : l)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${filterLevel === l ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
            {l === 'L1' ? '入门' : l === 'L2' ? '进阶' : '高级'}
          </button>
        ))}
      </div>

      {loading ? <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-12" /> : (
        <div className="grid gap-3">
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${levelBadge(c.level)}`}>{c.level === 'L1' ? '入门' : c.level === 'L2' ? '进阶' : '高级'}</span>
                  <span className="text-xs text-gray-400">{c.category?.name}</span>
                  <span className="text-xs text-gray-400">⏱ {c.read_time_minutes}分钟</span>
                </div>
                <h3 className="font-medium text-gray-900">{c.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {c.progress_status === 'completed' ? (
                  <span className="text-green-600 text-sm">✅ 已完成</span>
                ) : c.progress_status === 'in_progress' ? (
                  <span className="text-yellow-600 text-sm">📖 进行中</span>
                ) : (
                  <span className="text-gray-400 text-sm">未开始</span>
                )}
                <span className="text-gray-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
