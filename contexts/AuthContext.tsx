import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { AuthEvents } from '../utils/authEvents';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // Load user from localStorage if available
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          localStorage.removeItem('user');
        }
      }
    }
    setLoading(false);
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

      // Force a re-render by updating loading state
      setLoading(false);

      console.log('AuthContext: Login process completed');
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      setLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      console.log('AuthContext: Starting registration process...');
      const response = await authAPI.register(email, password, name);
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

      // Force a re-render by updating loading state
      setLoading(false);

      console.log('AuthContext: Registration process completed');
    } catch (error) {
      console.error('Registration failed', error);
      toast.error('Đăng ký thất bại. Email có thể đã được sử dụng.');
      setLoading(false);
      throw error;
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

  return (
    <AuthContext.Provider value={{
      user,
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
