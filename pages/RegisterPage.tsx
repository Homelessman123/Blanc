import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Mail, Key, UserPlus, ArrowLeft } from 'lucide-react';
import PreferencesForm from '../components/PreferencesForm';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleEmailBlur = async () => {
        if (!email) {
            setEmailError(null);
            return;
        }
        try {
            const response = await authAPI.checkEmail(email);
            if (response.data.exists) {
                setEmailError('Email này đã được sử dụng.');
            } else {
                setEmailError(null);
            }
        } catch (error) {
            console.error('Error checking email:', error);
        }
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailError) {
            toast.error('Vui lòng sửa các lỗi trước khi tiếp tục.');
            return;
        }
        try {
            const user = await register(email, password, name, location.trim() || null);
            if (user && user.id) {
                setRegisteredUserId(user.id);
                setStep(2);
            }
        } catch (error) {
            console.error('Registration error:', error);
        }
    };

    const handlePreferencesComplete = () => {
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-2xl"
            >
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className="p-8 backdrop-blur-lg bg-gray-800/80 border border-gray-600 shadow-2xl">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.4 }}
                                    className="text-center mb-8"
                                >
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                        Đăng Ký ContestHub
                                    </h1>
                                    <p className="text-gray-300">Bước 1/2: Tạo tài khoản</p>
                                </motion.div>

                                <form onSubmit={handleStep1Submit} className="space-y-6">
                                    <div>
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
                                                required
                                                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                placeholder="Nhập họ và tên"
                                            />
                                        </div>
                                    </div>

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
                                                onBlur={handleEmailBlur}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setEmailError(null);
                                                }}
                                                required
                                                className={`w-full bg-white/5 border ${emailError ? 'border-red-500' : 'border-white/20'} rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-500' : 'focus:ring-purple-500'} focus:border-transparent transition-all duration-200`}
                                                placeholder="Nhập email của bạn"
                                            />
                                        </div>
                                        {emailError && (
                                            <p className="text-sm text-red-400 mt-2">{emailError}</p>
                                        )}
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
                                                minLength={6}
                                                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                                            Bạn đang ở đâu? (Thành phố/Tỉnh)
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="location"
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                placeholder="Ví dụ: Hà Nội, TP. HCM, Đà Nẵng..."
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Thông tin vị trí giúp gợi ý đồng đội và sự kiện phù hợp hơn.</p>
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
                                                    Đang tạo tài khoản...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <UserPlus size={18} className="mr-2" />
                                                    Tiếp tục
                                                </div>
                                            )}
                                        </Button>
                                    </motion.div>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                                        >
                                            <ArrowLeft size={16} />
                                            Đã có tài khoản? Đăng nhập
                                        </button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.4 }}
                        >
                            {registeredUserId && (
                                <PreferencesForm
                                    userId={registeredUserId}
                                    onComplete={handlePreferencesComplete}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
