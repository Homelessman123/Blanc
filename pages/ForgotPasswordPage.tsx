import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Lock, ArrowLeft, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { authAPI } from '../services/api';

type Step = 'request' | 'verify' | 'reset';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mismatch, setMismatch] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const navigate = useNavigate();

  const secondsLabel = useMemo(() => (countdown > 0 ? `${countdown}s` : ''), [countdown]);

  useEffect(() => {
    setMismatch(confirmPassword.length > 0 && password !== confirmPassword);
  }, [password, confirmPassword]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequesting(true);
    setEmailError(null);

    try {
      const checkResponse = await authAPI.checkEmail(email.trim());
      if (!checkResponse.data.exists) {
        setEmailError('Email không tồn tại trong hệ thống.');
        setIsRequesting(false);
        return;
      }

      await authAPI.requestPasswordReset(email.trim());
      toast.success('Mã OTP đã được gửi tới email (hiệu lực 2 phút).');
      setStep('verify');
      setCountdown(120);
    } catch (error) {
      console.error('Failed to request OTP', error);
      toast.error('Không thể gửi OTP. Vui lòng kiểm tra email và thử lại.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const response = await authAPI.verifyPasswordReset(email.trim(), otp.trim());
      const token = response.data?.resetToken;
      if (token) {
        setResetToken(token);
      }
      toast.success('Xác thực OTP thành công. Vui lòng tạo mật khẩu mới.');
      setStep('reset');
    } catch (error) {
      console.error('Failed to verify OTP', error);
      toast.error('OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isRequesting) return;
    setIsRequesting(true);
    setOtp('');
    try {
      await authAPI.requestPasswordReset(email.trim());
      toast.success('Đã gửi lại OTP. Vui lòng kiểm tra email.');
      setCountdown(120);
      setStep('verify');
    } catch (error) {
      console.error('Failed to resend OTP', error);
      toast.error('Không thể gửi lại OTP. Thử lại sau.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) {
      toast.error('Mật khẩu không khớp.');
      return;
    }

    setIsResetting(true);
    try {
      await authAPI.completePasswordReset({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
        token: resetToken || undefined,
      });
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to reset password', error);
      toast.error('Không thể đổi mật khẩu. Thử lại sau.');
    } finally {
      setIsResetting(false);
    }
  };

  const otpDisabled = email.trim().length === 0;
  const canSubmitReset = !mismatch && password.length >= 6 && confirmPassword.length >= 6;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900"></div>
      <div className="fixed inset-0 bg-noise opacity-10 mix-blend-soft-light pointer-events-none"></div>
      <div className="fixed inset-x-0 bottom-0 h-72 bg-gradient-to-t from-indigo-900/70 via-purple-900/40 to-transparent"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="p-8 backdrop-blur-lg bg-gray-800/80 border border-gray-600 shadow-2xl">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <h1 className="mt-3 text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quên mật khẩu
            </h1>
            <p className="text-gray-300 mt-2">
              Nhập email để nhận mã OTP 6 chữ số (hiệu lực 2 phút) và đặt lại mật khẩu.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'request' && (
              <motion.form
                key="request"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRequestOtp}
                className="space-y-6"
              >
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold py-3"
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang gửi OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send size={18} />
                      Gửi mã OTP
                    </div>
                  )}
                </Button>

                <p className="text-sm text-yellow-400 animate-pulse font-semibold text-center">
                  Mã chỉ có hiệu lực 2 phút
                </p>
              </motion.form>
            )}

            {step === 'verify' && (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                    Mã OTP (6 chữ số)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 tracking-widest"
                      placeholder="Nhập OTP"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
                    <span>Còn lại: {secondsLabel || '0s'}</span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0 || isRequesting || otpDisabled}
                      className="flex items-center gap-2 text-blue-300 hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw size={14} />
                      Gửi lại OTP
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 transition-all duration-200 font-semibold py-3"
                  disabled={isVerifying || otp.length !== 6 || otpDisabled}
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang xác thực...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck size={18} />
                      Xác thực OTP
                    </div>
                  )}
                </Button>

                <p className="text-sm text-gray-400">
                  Hãy nhập đúng mã OTP trước khi hết hạn. OTP hợp lệ sẽ được xoá ngay sau khi xác thực thành công.
                </p>
              </motion.form>
            )}

            {step === 'reset' && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleResetPassword}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`w-full bg-white/5 border ${mismatch ? 'border-red-400' : 'border-white/20'} rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${mismatch ? 'focus:ring-red-400' : 'focus:ring-purple-500'} focus:border-transparent transition-all duration-200`}
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                  {mismatch && (
                    <p className="text-sm text-red-300 mt-2">
                      Mật khẩu không khớp. Vui lòng kiểm tra lại.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-200 font-semibold py-3"
                  disabled={isResetting || !canSubmitReset}
                >
                  {isResetting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang đổi mật khẩu...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} />
                      Xác nhận đổi mật khẩu
                    </div>
                  )}
                </Button>

                <p className="text-sm text-gray-400">
                  Sau khi đổi mật khẩu thành công, OTP và phiên xác thực tạm thời sẽ được xoá.
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
            >
              Quay về trang đăng nhập
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
