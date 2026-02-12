import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>RiskEdu</h1>
          <p>Student fail/pass risk intelligence</p>
        </div>
        <nav>
          {user?.role === 'student' && user.studentProfileId ? (
            <Link to={`/students/${user.studentProfileId}`}>My Profile</Link>
          ) : (
            <Link to="/dashboard">Dashboard</Link>
          )}
        </nav>
        <div className="topbar-user">
          <small>{user?.email}</small>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
