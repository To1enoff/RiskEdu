import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register, verifyEmail } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { AuthResponse } from '../types';

export const Login = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('student@riskedu.local');
  const [password, setPassword] = useState('StrongPass123');
  const [fullName, setFullName] = useState('Student User');
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'login') {
        return login(email, password);
      }
      if (mode === 'register') {
        return register(email, password, fullName);
      }
      return verifyEmail(email, verificationCode);
    },
    onSuccess: (result) => {
      if (mode === 'register') {
        setMode('verify');
        setInfoMessage('Verification code sent. Check your email and enter code below.');
        return;
      }
      const session = result as AuthResponse;
      setSession(session);
      if (session.user.role === 'student') {
        navigate('/student/dashboard');
        return;
      }
      navigate('/admin/dashboard');
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    authMutation.mutate();
  };

  return (
    <div className="grid min-h-[80vh] place-items-center">
      <Card variant="glass" className="w-full max-w-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Confirm email'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'verify'
            ? 'Enter the 6-digit code sent to your email.'
            : 'Sign in to access student risk intelligence.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
            </>
          )}
          {mode === 'verify' && (
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              placeholder="Verification code"
              maxLength={6}
            />
          )}

          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
          {mode !== 'verify' && (
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
            />
          )}

          <Button className="w-full" disabled={authMutation.isPending}>
            {authMutation.isPending
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : mode === 'register'
                  ? 'Create account'
                  : 'Confirm email'}
          </Button>
        </form>

        {infoMessage && <p className="mt-3 text-sm font-medium text-slate-600">{infoMessage}</p>}
        {authMutation.isError && <p className="mt-3 text-sm font-medium text-red-600">Authentication failed.</p>}

        {mode !== 'verify' && (
          <button
            type="button"
            onClick={() => {
              setInfoMessage('');
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
            }}
            className="mt-4 text-sm font-semibold text-blue-600"
          >
            {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
          </button>
        )}
        {mode === 'verify' && (
          <button
            type="button"
            onClick={() => {
              setInfoMessage('');
              setMode('login');
            }}
            className="mt-4 text-sm font-semibold text-blue-600"
          >
            Back to login
          </button>
        )}
      </Card>
    </div>
  );
};
