import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BrandLogo } from '../components/ui/BrandLogo';

export const MainLayout = () => (
  <div className="min-h-screen section-soft">
    <header className="border-b border-blue-100/70 bg-gradient-to-r from-sky-100/70 via-indigo-50/80 to-blue-100/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogo to="/" />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8">
      <Outlet />
    </main>
  </div>
);
