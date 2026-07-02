import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', icon: '🏠', label: '首页' },
  { to: '/courses', icon: '📚', label: '学习中心' },
  { to: '/exams', icon: '📝', label: '考试中心' },
  { to: '/stats', icon: '📊', label: '成绩分析' },
];

const adminItems = [
  { to: '/admin/questions', icon: '❓', label: '题库管理' },
  { to: '/admin/courses', icon: '🎓', label: '课程管理' },
  { to: '/admin/users', icon: '👥', label: '用户管理' },
  { to: '/admin/exams', icon: '⚙️', label: '考试管理' },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  if (!user) return <Outlet />;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">AI 研习社</h1>
          <p className="text-xs text-gray-400 mt-1">部门 AI 学习平台</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="text-lg">{icon}</span> {label}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">管理</div>
              {adminItems.map(({ to, icon, label }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span className="text-lg">{icon}</span> {label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user.real_name}</p>
              <p className="text-xs text-gray-400">{user.role === 'admin' ? '管理员' : '学员'}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="退出登录">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
