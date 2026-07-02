import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { DepartmentStats } from '@/types';

export default function DepartmentStats() {
  const [stats, setStats] = useState<DepartmentStats | null>(null);

  useEffect(() => { api.get('/stats/department').then((r) => setStats(r.data)); }, []);

  if (!stats) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 部门成绩分析</h2>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '学员总数', value: stats.total_users },
          { label: '考试次数', value: stats.total_exams },
          { label: '平均分', value: `${stats.avg_score} 分` },
          { label: '通过率', value: `${stats.pass_rate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">📈 各等级正确率</h3>
          <div className="space-y-3">
            {stats.level_stats.map((l) => {
              const labels: Record<string, string> = { L1: '入门', L2: '进阶', L3: '高级' };
              return (
                <div key={l.level}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{labels[l.level] || l.level} ({l.level})</span>
                    <span className="font-medium">{l.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${l.accuracy >= 70 ? 'bg-green-500' : l.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.max(2, l.accuracy)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">🎯 各知识领域掌握度</h3>
          <div className="space-y-2">
            {stats.category_stats.sort((a, b) => a.accuracy - b.accuracy).map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{c.category}</span>
                  <span>{c.accuracy}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${c.accuracy >= 70 ? 'bg-green-500' : c.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(2, c.accuracy)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
