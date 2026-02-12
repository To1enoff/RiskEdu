import { ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { AuthResponse, AuthUser } from '../types';
import { storage } from '../utils/storage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  applySession: (session: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUserFromStorage(): AuthUser | null {
  const raw = storage.getUser();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUserFromStorage());
  const [token, setToken] = useState<string | null>(storage.getToken());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      applySession: (session) => {
        storage.setToken(session.accessToken);
        storage.setUser(JSON.stringify(session.user));
        setToken(session.accessToken);
        setUser(session.user);
      },
      logout: () => {
        storage.clearToken();
        storage.clearUser();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
