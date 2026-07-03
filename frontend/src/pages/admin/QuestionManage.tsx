import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Question, Category } from '@/types';

export default function QuestionManage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [filter, setFilter] = useState({ category_id: '', level: '', type: '', search: '' });

  const emptyForm = { category_id: 1, level: 'L1', type: 'single', title: '', options: ['A', 'B', 'C', 'D'], correct_answer: 'A' as string | string[] | boolean, score: 2 };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { api.get('/courses/categories').then((r) => setCategories(r.data)); fetchQuestions(); }, []);

  const fetchQuestions = () => {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => { if (v) p.set(k, v); });
    api.get(`/questions?${p}`).then((r) => setQuestions(r.data));
  };

  const handleSave = async () => {
    if (editing) {
      await api.put(`/questions/${editing.id}`, form);
    } else {
      await api.post('/questions', form);
    }
    setShowForm(false); setEditing(null); setForm(emptyForm); fetchQuestions();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除？')) return;
    await api.delete(`/questions/${id}`);
    fetchQuestions();
  };

  const handleEdit = async (id: number) => {
    const r = await api.get(`/questions/${id}`);
    setEditing(r.data);
    setForm({ category_id: r.data.category_id, level: r.data.level, type: r.data.type, title: r.data.title, options: r.data.options, correct_answer: r.data.correct_answer, score: r.data.score });
    setShowForm(true);
  };

  const typeLabel = (t: string) => ({ single: '单选题', multi: '多选题', true_false: '判断题' }[t] || t);

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">❓ 题库管理</h2>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加题目</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold">{editing ? '编辑题目' : '添加题目'}</h3>
          <div className="grid grid-cols-4 gap-3">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="L1">入门</option><option value="L2">进阶</option><option value="L3">高级</option>
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, options: e.target.value === 'true_false' ? [] : ['A', 'B', 'C', 'D'], correct_answer: e.target.value === 'multi' ? [] : e.target.value === 'true_false' ? true : 'A' })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="single">单选题</option><option value="multi">多选题</option><option value="true_false">判断题</option>
            </select>
            <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              placeholder="分值" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <textarea value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="题目内容" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          {form.type !== 'true_false' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">选项（每行一个，如 A. 选项内容）</label>
              <textarea value={form.options.join('\n')} onChange={(e) => setForm({ ...form, options: e.target.value.split('\n').filter(Boolean) })}
                rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {form.type === 'multi' ? '正确答案（多选，如 A,B,C）' : form.type === 'true_false' ? '正确答案' : '正确答案（如 A）'}
            </label>
            {form.type === 'true_false' ? (
              <select value={String(form.correct_answer)} onChange={(e) => setForm({ ...form, correct_answer: e.target.value === 'true' })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="true">正确 ✅</option><option value="false">错误 ❌</option>
              </select>
            ) : form.type === 'multi' ? (
              <input type="text" value={Array.isArray(form.correct_answer) ? form.correct_answer.join(',') : String(form.correct_answer)}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="A,B,C" />
            ) : (
              <input type="text" value={String(form.correct_answer)}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="A" />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">保存</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
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
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
          <option value="">全部题型</option>
          <option value="single">单选题</option><option value="multi">多选题</option><option value="true_false">判断题</option>
        </select>
        <input value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="搜索题目..." className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm flex-1" />
        <button onClick={fetchQuestions} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">筛选</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">题目</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-30">题型</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">等级</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">分值</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800 max-w-md truncate">{q.title}</td>
                <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{typeLabel(q.type)}</span></td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{q.level}</span></td>
                <td className="px-4 py-3 text-gray-500">{q.score}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(q.id)} className="text-xs text-blue-600 hover:text-blue-700">编辑</button>
                    <button onClick={() => handleDelete(q.id)} className="text-xs text-red-500 hover:text-red-600">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
