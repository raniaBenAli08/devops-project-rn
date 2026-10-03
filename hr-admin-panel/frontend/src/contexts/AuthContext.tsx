import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hr_user');
    const storedToken = localStorage.getItem('hr_token');
    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    let parsedUser: AuthUser;
    try {
      parsedUser = JSON.parse(storedUser) as AuthUser;
    } catch (error) {
      console.error('Stored user session is invalid:', error);
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_user');
      setLoading(false);
      return;
    }

    setUser(parsedUser);
    apiClient.get('/auth/me')
      .then(({ data }) => {
        const refreshedUser: AuthUser = { ...parsedUser, ...data, token: storedToken };
        localStorage.setItem('hr_user', JSON.stringify(refreshedUser));
        setUser(refreshedUser);
      })
      .catch((error) => {
        console.error('Failed to refresh authenticated user:', error);
        localStorage.removeItem('hr_token');
        localStorage.removeItem('hr_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { token, userId, role, employeeId } = response.data;
    const authUser: AuthUser = {
      id: userId,
      employeeId,
      username: response.data.username,
      email: '',
      role,
      token,
    };
    localStorage.setItem('hr_token', token);
    localStorage.setItem('hr_user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
