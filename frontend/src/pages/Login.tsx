import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

export const Login = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('advisor@riskedu.local');
  const [password, setPassword] = useState('StrongPass123');
  const [fullName, setFullName] = useState('Student User');
  const [role, setRole] = useState<UserRole>('student');

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'login') {
        return login(email, password);
      }
      return register(email, password, role, fullName);
    },
    onSuccess: (session) => {
      setSession(session);
      if (session.user.role === 'student' && session.user.studentProfileId) {
        navigate(`/students/${session.user.studentProfileId}`);
        return;
      }
      navigate('/dashboard');
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    authMutation.mutate();
  };

  return (
    <div className="grid min-h-[80vh] place-items-center">
      <Card variant="glass" className="w-full max-w-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to access student risk intelligence.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="student">Student</option>
                <option value="advisor">Advisor</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}

          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
          />

          <Button className="w-full" disabled={authMutation.isPending}>
            {authMutation.isPending ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </Button>
        </form>

        {authMutation.isError && <p className="mt-3 text-sm font-medium text-red-600">Authentication failed.</p>}

        <button
          type="button"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          className="mt-4 text-sm font-semibold text-blue-600"
        >
          {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
        </button>
      </Card>
    </div>
  );
};
