import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Calendar, Bell } from 'lucide-react';

interface SuccessToastProps {
    isVisible: boolean;
    onClose: () => void;
    contestTitle: string;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ isVisible, onClose, contestTitle }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto close after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -100, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="fixed top-4 right-4 z-[100] max-w-md"
                >
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-2xl p-4 border-2 border-green-400/50">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                                >
                                    <CheckCircle size={32} className="text-white" />
                                </motion.div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                    🎉 Đăng ký thành công!
                                </h3>
                                <p className="text-green-50 text-sm mb-2">
                                    Bạn đã đăng ký tham gia: <span className="font-semibold">{contestTitle}</span>
                                </p>
                                <div className="space-y-1 text-xs text-green-100">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>✓ Đã thêm vào lịch sự kiện</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bell size={14} />
                                        <span>✓ Thông báo nhắc nhở đã được kích hoạt</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex-shrink-0 text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                                aria-label="Close notification"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress bar */}
                        <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl"
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuccessToast;
