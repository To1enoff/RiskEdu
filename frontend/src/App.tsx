import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './layout/DashboardLayout';
import { MainLayout } from './layout/MainLayout';
import { Analytics } from './pages/Analytics';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { StudentDetails } from './pages/StudentDetails';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
