import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Exam, Question, Category } from '@/types';

export default function ExamManage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', time_limit_minutes: 30, pass_score: 60, question_ids: [] as number[] });
  const [filter, setFilter] = useState({ category_id: '', level: '' });

  const fetchExams = () => { api.get('/exams').then((r) => setExams(r.data)); };

  useEffect(() => {
    api.get('/courses/categories').then((r) => setCategories(r.data));
    fetchExams();
  }, []);

  const fetchQuestions = () => {
    const p = new URLSearchParams();
    if (filter.category_id) p.set('category_id', filter.category_id);
    if (filter.level) p.set('level', filter.level);
    api.get(`/questions?${p}`).then((r) => setQuestions(r.data));
  };

  const handleCreate = async () => {
    if (form.question_ids.length === 0) { alert('请至少选择一道题目'); return; }
    await api.post('/exams', form);
    setShowForm(false);
    setForm({ title: '', description: '', time_limit_minutes: 30, pass_score: 60, question_ids: [] });
    fetchExams();
  };

  const toggleQuestion = (qid: number) => {
    setForm((prev) => ({
      ...prev,
      question_ids: prev.question_ids.includes(qid) ? prev.question_ids.filter((id) => id !== qid) : [...prev.question_ids, qid],
    }));
  };

  const selectedScore = questions.filter((q) => form.question_ids.includes(q.id)).reduce((sum, q) => sum + q.score, 0);

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">⚙️ 考试管理</h2>
        <button onClick={() => { setShowForm(true); fetchQuestions(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建考试</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold">创建考试</h3>
          <div className="grid grid-cols-4 gap-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="考试名称" className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2" />
            <input type="number" value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: Number(e.target.value) })}
              placeholder="时长(分钟)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="number" value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: Number(e.target.value) })}
              placeholder="及格分数" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="考试描述（可选）" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-500">选题筛选：</span>
            <select value={filter.category_id} onChange={(e) => setFilter({ ...filter, category_id: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">全部领域</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filter.level} onChange={(e) => setFilter({ ...filter, level: e.target.value })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">全部等级</option>
              <option value="L1">入门</option><option value="L2">进阶</option><option value="L3">高级</option>
            </select>
            <button onClick={fetchQuestions} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">筛选</button>
            <span className="ml-auto text-sm text-gray-500">
              已选 <span className="font-bold text-blue-600">{form.question_ids.length}</span> 题 · 总分 <span className="font-bold text-blue-600">{selectedScore}</span>
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {questions.map((q) => (
              <label key={q.id} className={`flex items-start gap-2 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${form.question_ids.includes(q.id) ? 'bg-blue-50' : ''}`}>
                <input type="checkbox" checked={form.question_ids.includes(q.id)} onChange={() => toggleQuestion(q.id)} className="mt-0.5 text-blue-600 rounded" />
                <div className="flex-1 text-sm">
                  <span>{q.title}</span>
                  <span className="text-xs text-gray-400 ml-2">({q.type === 'single' ? '单选' : q.type === 'multi' ? '多选' : '判断'} · {q.score}分)</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">创建考试</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">考试名称</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">题数</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">时长</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">总分</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">及格</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{e.title}</td>
                <td className="px-4 py-3 text-gray-500">{e.question_count}</td>
                <td className="px-4 py-3 text-gray-500">{e.time_limit_minutes}分钟</td>
                <td className="px-4 py-3 text-gray-500">{e.total_score}</td>
                <td className="px-4 py-3 text-gray-500">{e.pass_score}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.status === 'published' ? '已发布' : e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
