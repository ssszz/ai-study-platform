import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User } from '@/types';

export default function UserManage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', password: '', real_name: '', department: '', role: 'user' });

  const fetchUsers = () => { api.get('/users').then((r) => setUsers(r.data)); };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async () => {
    if (editingId) {
      await api.put(`/users/${editingId}`, { real_name: form.real_name, department: form.department, role: form.role });
    } else {
      await api.post('/users', form);
    }
    setShowForm(false); setEditingId(null); fetchUsers();
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setForm({ username: u.username, password: '', real_name: u.real_name, department: u.department, role: u.role });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该用户？')) return;
    try { await api.delete(`/users/${id}`); fetchUsers(); } catch (err: any) { alert(err.response?.data?.detail || '删除失败'); }
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">👥 用户管理</h2>
        <button onClick={() => { setEditingId(null); setForm({ username: '', password: '', real_name: '', department: '', role: 'user' }); setShowForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加用户</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold">{editingId ? '编辑用户' : '添加用户'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="用户名" disabled={!!editingId} className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50" />
            {!editingId && <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="密码（至少6位）" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />}
            <input value={form.real_name} onChange={(e) => setForm({ ...form, real_name: e.target.value })}
              placeholder="真实姓名" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="部门" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="user">普通用户</option><option value="admin">管理员</option>
            </select>
          </div>
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
              <th className="px-4 py-3 font-medium text-gray-500">用户名</th>
              <th className="px-4 py-3 font-medium text-gray-500">姓名</th>
              <th className="px-4 py-3 font-medium text-gray-500">部门</th>
              <th className="px-4 py-3 font-medium text-gray-500">角色</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.real_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.department}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role === 'admin' ? '管理员' : '学员'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(u)} className="text-xs text-blue-600">编辑</button>
                    <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500">删除</button>
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
