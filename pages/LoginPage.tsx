import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Mail, Key, LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLoginRedirect } from '../hooks/useLoginRedirect';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, isAuthenticated } = useAuth();
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
            console.log('Attempting login with:', email);

            await login(email, password);
            console.log('Login function completed');

            // Wait a bit and check state
            setTimeout(() => {
                console.log('Post-login auth state:', { isAuthenticated, loading });
                console.log('Current URL:', window.location.href);
            }, 100);

            console.log('=== LOGIN ATTEMPT END ===');
        } catch (error) {
            console.error('Authentication error:', error);
            // Error is already handled in context with toast
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 overflow-hidden">
            {/* Fullscreen gradient backdrop */}
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900"></div>
            <div className="fixed inset-0 bg-noise opacity-10 mix-blend-soft-light pointer-events-none"></div>
            <div className="fixed inset-x-0 bottom-0 h-72 bg-gradient-to-t from-indigo-900/70 via-purple-900/40 to-transparent"></div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="p-8 backdrop-blur-lg bg-gray-800/80 border border-gray-600 shadow-2xl">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            ContestHub
                        </h1>
                        <p className="text-gray-300">Chào mừng trở lại!</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">

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
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Nhập mật khẩu"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-transform duration-200 hover:scale-110 focus:outline-none"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? <EyeOff size={22} strokeWidth={2.9} /> : <Eye size={22} strokeWidth={2.9} />}
                                </button>
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
                                        Đang đăng nhập...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <LogIn size={18} className="mr-2" />
                                        Đăng nhập
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        <div className="text-center">
                            <Link
                                to="/register"
                                className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
                            >
                                Chưa có tài khoản? Đăng ký ngay
                            </Link>
                        </div>

                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-300 hover:text-blue-200 transition-colors duration-200"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default LoginPage;
