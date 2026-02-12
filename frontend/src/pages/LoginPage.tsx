import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const [email, setEmail] = useState('advisor@riskedu.local');
  const [password, setPassword] = useState('StrongPass123');
  const [fullName, setFullName] = useState('Student User');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('advisor');

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'login') {
        return login(email, password);
      }
      return register(email, password, role, fullName);
    },
    onSuccess: (session) => {
      applySession(session);
      if (session.user.role === 'student' && session.user.studentProfileId) {
        navigate(`/students/${session.user.studentProfileId}`);
        return;
      }
      navigate('/dashboard');
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>RiskEdu</h1>
        <p>Explainable risk prediction for student success teams.</p>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {mode === 'register' && (
          <>
            <label>
              Full name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                <option value="student">Student</option>
                <option value="advisor">Advisor</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </>
        )}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        {mutation.isError && <p className="form-error">Request failed. Check credentials or role.</p>}

        <button
          type="button"
          className="ghost"
          onClick={() => setMode((previous) => (previous === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? 'Need an account?' : 'Back to login'}
        </button>
      </form>
    </div>
  );
}
