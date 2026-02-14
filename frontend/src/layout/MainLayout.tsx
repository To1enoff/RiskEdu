import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const MainLayout = () => (
  <div className="min-h-screen">
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
      <Link to="/" className="text-xl font-bold text-slate-900">
        RiskEdu
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="outline">Login</Button>
        </Link>
        <Link to="/dashboard">
          <Button>Dashboard</Button>
        </Link>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl px-6 pb-16">
      <Outlet />
    </main>
  </div>
);
