import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { AuthEvents } from '../utils/authEvents';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, location?: string | null) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token) {
      if (savedUser) {
        localStorage.removeItem('user');
      }
      setUser(null);
      setLoading(false);
      return;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    try {
      const response = await authAPI.getCurrentUser();
      // Backend now returns { user: {...} } instead of just user data
      const userData = response.data.user || response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('AuthContext: Starting login process...');
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;

      console.log('AuthContext: Login API successful, setting user data...');

      // Store data immediately
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state immediately for instant UI update
      setUser(userData);

      console.log('AuthContext: User state updated, user is now:', userData);

      // Emit login event to notify all components
      AuthEvents.login();

      toast.success('Đăng nhập thành công!');

      console.log('AuthContext: Login process completed');
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, location?: string | null): Promise<User> => {
    setLoading(true);
    try {
      console.log('AuthContext: Starting registration process...');
      const response = await authAPI.register(email, password, name, location);
      const { token, user: userData } = response.data;

      console.log('AuthContext: Registration API successful, setting user data...');

      // Store data immediately
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state immediately for instant UI update
      setUser(userData);

      console.log('AuthContext: User state updated, user is now:', userData);

      // Emit login event to notify all components
      AuthEvents.login();

      toast.success('Đăng ký thành công!');

      console.log('AuthContext: Registration process completed');

      return userData;
    } catch (error) {
      console.error('Registration failed', error);
      toast.error('Đăng ký thất bại. Email có thể đã được sử dụng.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Emit logout event to notify all components
    AuthEvents.logout();

    toast.success('Đã đăng xuất');
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const token = localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      updateUser,
      loading,
      isAuthenticated: !!user,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
