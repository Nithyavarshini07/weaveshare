import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

type Role = 'SELLER' | 'BUYER' | 'ADMIN';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string | null;
  phone?: string | null;
  profileImage?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, role: Role) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    // FIX: Save the token returned by the login controller.
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (payload: any) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
