import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, School, Calendar, AlertCircle, CheckCircle, Loader, AlertTriangle, Coffee } from 'lucide-react';
import Button from './common/Button';
import type { Contest } from '../types';

interface ScheduleConflict {
    type: 'CONFLICT' | 'REST_PERIOD';
    message: string;
    conflictingContest?: {
        id: string;
        title: string;
        startDate: Date;
        endDate: Date;
    };
}

interface ContestRegistrationModalProps {
    contest: Contest;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    school: string;
    grade: string;
    birthDate: string;
    parentPhone?: string;
    reason: string;
}

const ContestRegistrationModal: React.FC<ContestRegistrationModalProps> = ({
    contest,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        school: '',
        grade: '',
        birthDate: '',
        parentPhone: '',
        reason: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
    const [loadingConflicts, setLoadingConflicts] = useState(true);

    // Check for schedule conflicts when modal opens
    useEffect(() => {
        if (isOpen) {
            checkScheduleConflicts();
        }
    }, [isOpen, contest.id]);

    const checkScheduleConflicts = async () => {
        setLoadingConflicts(true);
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                setLoadingConflicts(false);
                return;
            }

            const response = await fetch('http://localhost:3000/api/contest/check-conflicts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contestId: contest.id,
                    userId,
                }),
            });

            const data = await response.json();

            if (response.ok && data.hasConflicts) {
                setConflicts(data.conflicts);
            } else {
                setConflicts([]);
            }
        } catch (error) {
            console.error('Error checking conflicts:', error);
            setConflicts([]);
        } finally {
            setLoadingConflicts(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }
        if (!formData.school.trim()) newErrors.school = 'Vui lòng nhập tên trường';
        if (!formData.grade.trim()) newErrors.grade = 'Vui lòng chọn khối/lớp';
        if (!formData.birthDate) newErrors.birthDate = 'Vui lòng chọn ngày sinh';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                alert('Vui lòng đăng nhập để đăng ký cuộc thi!');
                return;
            }

            const response = await fetch('http://localhost:3000/api/contest/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contestId: contest.id,
                    userId,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            // Show success and call onSuccess
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Registration error:', error);
            alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: -50,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                damping: 25,
                stiffness: 300,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            y: -50,
            transition: {
                duration: 0.2,
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-sky-500/20"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-sky-500 to-blue-600 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Calendar className="animate-bounce" />
                                        Đăng ký tham gia cuộc thi
                                    </h2>
                                    <p className="text-sky-100 font-semibold">{contest.title}</p>
                                    {contest.fee !== undefined && (
                                        <p className="text-white mt-2 text-lg font-bold">
                                            {contest.fee === 0 ? '🎉 Miễn phí' : `💰 Phí: $${contest.fee}`}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Schedule Conflict Warnings */}
                            {loadingConflicts ? (
                                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center justify-center gap-3">
                                    <Loader className="animate-spin text-sky-400" size={20} />
                                    <span className="text-gray-300">Đang kiểm tra lịch thi...</span>
                                </div>
                            ) : conflicts.length > 0 ? (
                                <div className="space-y-3">
                                    {conflicts.map((conflict, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`${conflict.type === 'CONFLICT'
                                                    ? 'bg-red-500/20 border-red-500/50'
                                                    : 'bg-yellow-500/20 border-yellow-500/50'
                                                } border-2 rounded-xl p-4 backdrop-blur-sm`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {conflict.type === 'CONFLICT' ? (
                                                        <span className="text-3xl animate-bounce">⚠️</span>
                                                    ) : (
                                                        <span className="text-3xl animate-pulse">☕</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-bold text-lg mb-1 ${conflict.type === 'CONFLICT' ? 'text-red-300' : 'text-yellow-300'
                                                        }`}>
                                                        {conflict.type === 'CONFLICT'
                                                            ? '🚨 Cảnh báo: Trùng lịch thi!'
                                                            : '💤 Thời gian nghỉ ngơi'}
                                                    </h4>
                                                    <p className={`text-sm ${conflict.type === 'CONFLICT' ? 'text-red-200' : 'text-yellow-200'
                                                        }`}>
                                                        {conflict.message}
                                                    </p>
                                                    {conflict.conflictingContest && (
                                                        <div className="mt-2 text-xs opacity-80">
                                                            <p className={
                                                                conflict.type === 'CONFLICT' ? 'text-red-100' : 'text-yellow-100'
                                                            }>
                                                                📅 {new Date(conflict.conflictingContest.startDate).toLocaleDateString('vi-VN')}
                                                                {' → '}
                                                                {new Date(conflict.conflictingContest.endDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {conflict.type === 'CONFLICT' && (
                                                        <p className="mt-2 text-xs text-red-200 font-semibold">
                                                            💡 Bạn vẫn có thể đăng ký nhưng cần cân nhắc kỹ!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : null}

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-sky-400" />
                                    Họ và tên <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.fullName ? 'border-red-500' : 'border-gray-600'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && (
                                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle size={14} /> {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Email & Phone */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <Mail size={16} className="text-sky-400" />
                                        Email <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.email ? 'border-red-500' : 'border-gray-600'
                                            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                        placeholder="example@email.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <Phone size={16} className="text-sky-400" />
                                        Số điện thoại <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.phone ? 'border-red-500' : 'border-gray-600'
                                            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                        placeholder="0123456789"
                                    />
                                    {errors.phone && (
                                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* School & Grade */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <School size={16} className="text-sky-400" />
                                        Trường học <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="school"
                                        value={formData.school}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.school ? 'border-red-500' : 'border-gray-600'
                                            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                        placeholder="THPT Nguyễn Huệ"
                                    />
                                    {errors.school && (
                                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.school}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <School size={16} className="text-sky-400" />
                                        Khối/Lớp <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.grade ? 'border-red-500' : 'border-gray-600'
                                            } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                        title="Chọn khối/lớp"
                                    >
                                        <option value="">Chọn khối/lớp</option>
                                        <option value="6">Lớp 6</option>
                                        <option value="7">Lớp 7</option>
                                        <option value="8">Lớp 8</option>
                                        <option value="9">Lớp 9</option>
                                        <option value="10">Lớp 10</option>
                                        <option value="11">Lớp 11</option>
                                        <option value="12">Lớp 12</option>
                                    </select>
                                    {errors.grade && (
                                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.grade}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Birth Date & Parent Phone */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <Calendar size={16} className="text-sky-400" />
                                        Ngày sinh <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-gray-700/50 border ${errors.birthDate ? 'border-red-500' : 'border-gray-600'
                                            } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                                        title="Chọn ngày sinh"
                                    />
                                    {errors.birthDate && (
                                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.birthDate}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                        <Phone size={16} className="text-sky-400" />
                                        SĐT Phụ huynh
                                    </label>
                                    <input
                                        type="tel"
                                        name="parentPhone"
                                        value={formData.parentPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                        placeholder="0987654321 (không bắt buộc)"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Lý do tham gia (không bắt buộc)
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none"
                                    placeholder="Chia sẻ lý do bạn muốn tham gia cuộc thi này..."
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <p className="text-blue-300 text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        Sau khi đăng ký thành công, thông tin cuộc thi sẽ được tự động thêm vào lịch sự kiện của bạn.
                                        Bạn sẽ nhận được email xác nhận trong vòng 24h.
                                    </span>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Tham gia ngay
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContestRegistrationModal;
