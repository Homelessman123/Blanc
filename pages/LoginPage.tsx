import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Mail, Key, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLoginRedirect } from '../hooks/useLoginRedirect';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const { login, register, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Use the custom hook for redirect handling
    useLoginRedirect('/', true);

    // Debug log để kiểm tra state
    useEffect(() => {
        console.log('LoginPage: Auth state changed:', { isAuthenticated, loading });
        console.log('LoginPage: Current location:', window.location.href);

        // If user is already authenticated when component loads, redirect immediately
        if (isAuthenticated && !loading) {
            console.log('LoginPage: User already authenticated, redirecting manually...');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log('=== LOGIN ATTEMPT START ===');
            console.log('Current auth state:', { isAuthenticated, loading });

            if (isLogin) {
                console.log('Attempting login with:', email);
                await login(email, password);
                console.log('Login function completed');

                // Wait a bit and check state
                setTimeout(() => {
                    console.log('Post-login auth state:', { isAuthenticated, loading });
                    console.log('Current URL:', window.location.href);
                }, 100);
            } else {
                console.log('Attempting registration with:', email, name);
                await register(email, password, name);
                console.log('Registration function completed');

                // Wait a bit and check state
                setTimeout(() => {
                    console.log('Post-registration auth state:', { isAuthenticated, loading });
                    console.log('Current URL:', window.location.href);
                }, 100);
            }
            console.log('=== LOGIN ATTEMPT END ===');
        } catch (error) {
            console.error('Authentication error:', error);
            // Error is already handled in context with toast
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 backdrop-blur-lg bg-gray-800 bg-opacity-80 border border-gray-600 shadow-2xl">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            ContestHub
                        </h1>
                        <p className="text-gray-300">
                            {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Họ và tên
                                </label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                        className="w-full bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Nhập email của bạn"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-white bg-opacity-5 border border-white border-opacity-20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Nhập mật khẩu"
                                />
                            </div>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold py-3"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        {isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        {isLogin ? <LogIn size={18} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
                                        {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
                            >
                                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="text-center text-sm text-gray-400">
                                <p>Demo accounts:</p>
                                <p>Admin: admin@contesthub.com / password</p>
                                <p>User: user@test.com / password</p>
                                <p>Teacher: teacher@test.com / password</p>
                            </div>
                        )}
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default LoginPage;
