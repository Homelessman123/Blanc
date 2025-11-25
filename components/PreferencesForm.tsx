import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import Button from './common/Button';

interface PreferencesFormProps {
    userId: string;
    onComplete: () => void;
    onSkip?: () => void;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ userId, onComplete, onSkip }) => {
    const [formData, setFormData] = useState({
        interests: [] as string[],
        talents: [] as string[],
        futureMajor: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Danh sách gợi ý
    const interestOptions = [
        'Toán học', 'Vật lý', 'Hóa học', 'Sinh học',
        'Tin học', 'Tiếng Anh', 'Văn học', 'Lịch sử',
        'Địa lý', 'Âm nhạc', 'Mỹ thuật', 'Thể thao',
        'Kinh tế', 'Khoa học xã hội', 'Kỹ thuật', 'Nghệ thuật'
    ];

    const talentOptions = [
        'Lập trình', 'Thiết kế', 'Viết lách', 'Thuyết trình',
        'Giải toán', 'Nghiên cứu khoa học', 'Ngoại ngữ', 'Âm nhạc',
        'Hội họa', 'Robot/IoT', 'Phân tích dữ liệu', 'Quản lý dự án',
        'Marketing', 'Nhiếp ảnh', 'Video editing', 'Tranh biện'
    ];

    const majorOptions = [
        'Công nghệ thông tin',
        'Kỹ thuật phần mềm',
        'Khoa học máy tính',
        'An toàn thông tin',
        'Trí tuệ nhân tạo',
        'Khoa học dữ liệu',
        'Kỹ thuật điện tử',
        'Cơ khí',
        'Y khoa',
        'Dược',
        'Luật',
        'Kinh tế',
        'Quản trị kinh doanh',
        'Marketing',
        'Ngôn ngữ Anh',
        'Báo chí - Truyền thông',
        'Thiết kế đồ họa',
        'Kiến trúc',
        'Khác'
    ];

    const toggleSelection = (field: 'interests' | 'talents', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.interests.length === 0 || formData.talents.length === 0) {
            alert('Vui lòng chọn ít nhất 1 sở thích và 1 năng khiếu!');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/auth/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    interests: formData.interests,
                    talents: formData.talents,
                    futureMajor: formData.futureMajor || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Không thể lưu thông tin');
            }

            onComplete();
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-gray-800 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-sky-500/30 shadow-2xl shadow-sky-500/20"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mb-4">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Hãy Cho Chúng Tôi Biết Về Bạn! 🌟
                    </h2>
                    <p className="text-gray-400">
                        Thông tin này giúp ContestBot gợi ý các cuộc thi phù hợp nhất với bạn
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sở thích */}
                    <div>
                        <label className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Heart className="text-pink-500" size={24} />
                            Sở thích của bạn <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {interestOptions.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleSelection('interests', option)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${formData.interests.includes(option)
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/50'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            Đã chọn: {formData.interests.length} sở thích
                        </p>
                    </div>

                    {/* Năng khiếu */}
                    <div>
                        <label className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <Star className="text-yellow-500" size={24} />
                            Năng khiếu / Lĩnh vực bạn giỏi <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {talentOptions.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleSelection('talents', option)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${formData.talents.includes(option)
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            Đã chọn: {formData.talents.length} năng khiếu
                        </p>
                    </div>

                    {/* Ngành học tương lai */}
                    <div>
                        <label className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <GraduationCap className="text-purple-500" size={24} />
                            Ngành học dự định ở đại học (Không bắt buộc)
                        </label>
                        <select
                            value={formData.futureMajor}
                            onChange={(e) => setFormData(prev => ({ ...prev, futureMajor: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            title="Chọn ngành học dự định"
                            aria-label="Chọn ngành học dự định"
                        >
                            <option value="">-- Chọn ngành học --</option>
                            {majorOptions.map(major => (
                                <option key={major} value={major}>{major}</option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        {onSkip && (
                            <button
                                type="button"
                                onClick={onSkip}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-semibold transition-colors"
                            >
                                Bỏ qua
                            </button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting || formData.interests.length === 0 || formData.talents.length === 0}
                            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                'Đang lưu...'
                            ) : (
                                <>
                                    Hoàn thành <ArrowRight size={20} />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default PreferencesForm;
