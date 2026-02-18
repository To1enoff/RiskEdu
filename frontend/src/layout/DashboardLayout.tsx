import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { BrandLogo } from '../components/ui/BrandLogo';

export const DashboardLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen section-soft">
      <header className="border-b border-blue-100/70 bg-gradient-to-r from-sky-100/70 via-indigo-50/80 to-blue-100/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <BrandLogo to="/" />
            <p className="text-xs text-slate-600">Student fail/pass risk intelligence</p>
          </div>
          <nav className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard">
                  <Button variant="outline">Admin Dashboard</Button>
                </Link>
                <Link to="/analytics">
                  <Button variant="outline">Analytics</Button>
                </Link>
              </>
            )}
            {user?.role === 'student' && (
              <Link to="/student/dashboard">
                <Button variant="outline">My Courses</Button>
              </Link>
            )}
            <span className="hidden text-sm text-slate-600 md:inline">{user?.email}</span>
            <Button onClick={logout} variant="glass">
              Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
