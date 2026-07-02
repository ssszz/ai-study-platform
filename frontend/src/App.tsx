import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/Login';
import HomePage from '@/pages/Home';
import CourseList from '@/pages/CourseList';
import CourseDetail from '@/pages/CourseDetail';
import ExamList from '@/pages/ExamList';
import ExamTake from '@/pages/ExamTake';
import ExamResult from '@/pages/ExamResult';
import PersonalStats from '@/pages/PersonalStats';
import DepartmentStats from '@/pages/DepartmentStats';
import QuestionManage from '@/pages/admin/QuestionManage';
import CourseManage from '@/pages/admin/CourseManage';
import UserManage from '@/pages/admin/UserManage';
import ExamManage from '@/pages/admin/ExamManage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
            <Route path="/exams/:id" element={<ProtectedRoute><ExamTake /></ProtectedRoute>} />
            <Route path="/exams/:id/result" element={<ProtectedRoute><ExamResult /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><PersonalStats /></ProtectedRoute>} />
            <Route path="/stats/department" element={<AdminRoute><DepartmentStats /></AdminRoute>} />
            <Route path="/admin/questions" element={<AdminRoute><QuestionManage /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><CourseManage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManage /></AdminRoute>} />
            <Route path="/admin/exams" element={<AdminRoute><ExamManage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
