import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course, Category } from '@/types';

export default function CourseManage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', category_id: 1, level: 'L1', content: '', read_time_minutes: 10 });

  useEffect(() => {
    api.get('/courses/categories').then((r) => setCategories(r.data));
    api.get('/courses').then((r) => setCourses(r.data));
  }, []);

  const handleSave = async () => {
    if (editingId) {
      await api.put(`/courses/${editingId}`, form);
    } else {
      await api.post('/courses', form);
    }
    setShowForm(false); setEditingId(null);
    api.get('/courses').then((r) => setCourses(r.data));
  };

  const handleEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({ title: c.title, category_id: c.category_id, level: c.level, content: c.content, read_time_minutes: c.read_time_minutes });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除？')) return;
    await api.delete(`/courses/${id}`);
    api.get('/courses').then((r) => setCourses(r.data));
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🎓 课程管理</h2>
        <button onClick={() => { setEditingId(null); setForm({ title: '', category_id: 1, level: 'L1', content: '', read_time_minutes: 10 }); setShowForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加课程</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold">{editingId ? '编辑课程' : '添加课程'}</h3>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="课程标题" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="L1">入门</option><option value="L2">进阶</option><option value="L3">高级</option>
            </select>
            <input type="number" value={form.read_time_minutes} onChange={(e) => setForm({ ...form, read_time_minutes: Number(e.target.value) })}
              placeholder="阅读时长(分钟)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="课程内容（Markdown格式）" rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">保存</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-30">领域</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">等级</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">时长</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{c.title}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.category?.name}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.level}</span></td>
                <td className="px-4 py-3 text-gray-500">{c.read_time_minutes}分钟</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c)} className="text-xs text-blue-600">编辑</button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500">删除</button>
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
