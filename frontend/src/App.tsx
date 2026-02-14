import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { MainLayout } from './layout/MainLayout';
import { Analytics } from './pages/Analytics';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStudentDetails } from './pages/AdminStudentDetails';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { StudentCourse } from './pages/StudentCourse';
import { StudentDashboard } from './pages/StudentDashboard';
import { useAuth } from './hooks/useAuth';

const RoleDashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<RoleDashboardRedirect />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses/:id" element={<StudentCourse />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students/:id" element={<AdminStudentDetails />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
