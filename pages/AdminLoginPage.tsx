import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'admin@contesthub.com';

const AdminLoginPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await login(ADMIN_EMAIL, password);
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.role !== 'ADMIN') {
        logout();
        toast.error('Tài khoản không có quyền admin');
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      // login already handled toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800/70 border border-gray-700 rounded-2xl p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Đăng nhập Admin</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={ADMIN_EMAIL}
            readOnly
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
            placeholder="Nhập mật khẩu admin"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Khu vực admin được bảo vệ. Vui lòng không chia sẻ mật khẩu.
      </p>
    </div>
  );
};

export default AdminLoginPage;
