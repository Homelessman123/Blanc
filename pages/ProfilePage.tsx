
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Edit3, Camera, Palette, Image, Save, X, Flame, DollarSign, Download, PlusCircle, Upload, Trash2, Sparkles, Heart, Award, GraduationCap, Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ContestCalendar from '../components/ContestCalendar';
import toast from 'react-hot-toast';
import { userAPI, uploadAPI } from '../services/api';

const ProfilePage: React.FC = () => {
    const { user, updateUser, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedGifs, setUploadedGifs] = useState<any[]>([]);
    const [showGifGallery, setShowGifGallery] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        displayName: user?.displayName || user?.name || '',
        profileColor: user?.profileColor || '#6366f1',
        profileGif: user?.profileGif || '',
        phoneNumber: user?.phoneNumber || '',
        location: (user?.location as string | undefined) || '',
        interests: user?.interests ? (typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests) : [],
        talents: user?.talents ? (typeof user.talents === 'string' ? JSON.parse(user.talents) : user.talents) : [],
        futureMajor: user?.futureMajor || '',
    });

    const predefinedColors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
        '#f59e0b', '#10b981', '#06b6d4', '#6b7280',
        '#14b8a6', '#f43f5e', '#a855f7', '#3b82f6'
    ];

    const predefinedGifs = [
        'https://media.giphy.com/media/3oKIPEqDGUULpEU0aQ/giphy.gif',
        'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
        'https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif',
        'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
        'https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif',
        'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
    ];

    // Predefined options for interests, talents
    const interestOptions = [
        'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tin học',
        'Văn học', 'Lịch sử', 'Địa lý', 'Ngoại ngữ', 'Nghệ thuật',
        'Âm nhạc', 'Thể thao', 'Khoa học', 'Công nghệ', 'Kinh tế'
    ];

    const talentOptions = [
        'Lập trình', 'Thiết kế', 'Viết lách', 'Thuyết trình', 'Tư duy logic',
        'Sáng tạo', 'Lãnh đạo', 'Làm việc nhóm', 'Phân tích', 'Giải quyết vấn đề',
        'Nghiên cứu', 'Vẽ', 'Chơi nhạc cụ', 'Thể thao', 'Ngoại ngữ'
    ];

    const [newInterest, setNewInterest] = useState('');
    const [newTalent, setNewTalent] = useState('');
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        type: 'PERSONAL',
    });

    // Sync formData with user data when user changes (after login/reload)
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                displayName: user.displayName || user.name || '',
                profileColor: user.profileColor || '#6366f1',
                profileGif: user.profileGif || '',
                phoneNumber: user.phoneNumber || '',
                location: (user.location as string | undefined) || '',
                interests: user.interests ? (typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests) : [],
                talents: user.talents ? (typeof user.talents === 'string' ? JSON.parse(user.talents) : user.talents) : [],
                futureMajor: user.futureMajor || '',
            });
            // Load user data from Apps Script
            loadUserData();
        }
    }, [user]);

    useEffect(() => {
        loadUploadedGifs();
    }, []);

    const loadUserData = async () => {
        setIsLoadingData(true);
        try {
            // Fetch calendar events
            const eventsResponse = await userAPI.getCalendarEvents();
            if (eventsResponse.data.success) {
                const events = eventsResponse.data.events.map((event: any) => ({
                    id: event.eventId || event.id,
                    title: event.title,
                    description: event.description || '',
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    type: event.eventType || 'PERSONAL',
                    contestId: event.contestId,
                }));
                setCalendarEvents(events);
            }

            // Fetch registrations count
            const registrationsResponse = await userAPI.getRegistrations();
            if (registrationsResponse.data.success) {
                setRegistrationCount(registrationsResponse.data.registrations.length);
            }
        } catch (error) {
            console.error('Error loading user data from Apps Script:', error);
            // Keep mock data if API fails
            setCalendarEvents([
                {
                    id: '1',
                    title: 'Deadline đăng ký Olympic Tin học',
                    description: 'Hạn cuối nộp hồ sơ đăng ký',
                    startDate: new Date(2025, 8, 30, 23, 59),
                    endDate: new Date(2025, 8, 30, 23, 59),
                    type: 'CONTEST_DEADLINE' as const,
                    contestId: '1',
                },
                {
                    id: '2',
                    title: 'Thi IELTS thử',
                    description: 'Buổi thi thử IELTS miễn phí',
                    startDate: new Date(2025, 9, 5, 9, 0),
                    endDate: new Date(2025, 9, 5, 12, 0),
                    type: 'PERSONAL' as const,
                },
            ]);
            setRegistrationCount(5);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) {
            toast.error('Vui lòng nhập tiêu đề và thời gian bắt đầu/kết thúc');
            return;
        }

        try {
            const response = await userAPI.addCalendarEvent({
                title: newEvent.title,
                description: newEvent.description,
                startDate: newEvent.startDate,
                endDate: newEvent.endDate,
                type: newEvent.type || 'PERSONAL',
            });

            if (response.data.success) {
                const ev = response.data.event;
                setCalendarEvents((prev) => [
                    ...prev,
                    {
                        id: ev.id,
                        title: ev.title,
                        description: ev.description || '',
                        startDate: new Date(ev.startDate),
                        endDate: new Date(ev.endDate),
                        type: ev.type || 'PERSONAL',
                        contestId: ev.contestId,
                    },
                ]);
                toast.success('Đã thêm sự kiện');
                setShowAddEvent(false);
                setNewEvent({ title: '', description: '', startDate: '', endDate: '', type: 'PERSONAL' });
            }
        } catch (error: any) {
            console.error('Create event error:', error);
            toast.error('Không thể tạo sự kiện');
        }
    };

    const loadUploadedGifs = async () => {
        try {
            const response = await uploadAPI.getUserGifs();
            setUploadedGifs(response.data.gifs || []);
        } catch (error) {
            console.error('Load GIFs error:', error);
        }
    };

    // Helper functions for managing tags
    const addInterest = (interest: string) => {
        if (interest && !formData.interests.includes(interest)) {
            setFormData({ ...formData, interests: [...formData.interests, interest] });
            setNewInterest('');
        }
    };

    const removeInterest = (interest: string) => {
        setFormData({
            ...formData,
            interests: formData.interests.filter(i => i !== interest)
        });
    };

    const addTalent = (talent: string) => {
        if (talent && !formData.talents.includes(talent)) {
            setFormData({ ...formData, talents: [...formData.talents, talent] });
            setNewTalent('');
        }
    };

    const removeTalent = (talent: string) => {
        setFormData({
            ...formData,
            talents: formData.talents.filter(t => t !== talent)
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                phoneNumber: formData.phoneNumber?.trim() || null,
                location: formData.location?.trim() || null,
            };
            const response = await userAPI.updateProfile(payload);
            if (response.data.success) {
                updateUser(response.data.user);
                setIsEditing(false);
                toast.success('✅ Cập nhật thông tin thành công!');
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error('❌ Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/gif')) {
            toast.error('❌ Vui lòng chọn file GIF!');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('❌ File GIF không được vượt quá 10MB!');
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadAPI.uploadGif(file, true);
            if (response.data.success) {
                setFormData({ ...formData, profileGif: `http://localhost:3001${response.data.url}` });
                await loadUploadedGifs();
                toast.success('✅ Tải GIF lên thành công!');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('❌ Tải GIF thất bại: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteGif = async (filename: string) => {
        if (!confirm('Bạn có chắc muốn xóa GIF này không?')) return;

        try {
            const response = await uploadAPI.deleteGif(filename);
            if (response.data.success) {
                await loadUploadedGifs();
                if (formData.profileGif.includes(filename)) {
                    setFormData({ ...formData, profileGif: '' });
                }
                toast.success('✅ Đã xóa GIF!');
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('❌ Xóa GIF thất bại!');
        }
    };

    const handleSelectGif = (gifUrl: string) => {
        setFormData({ ...formData, profileGif: gifUrl });
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            displayName: user?.displayName || user?.name || '',
            profileColor: user?.profileColor || '#6366f1',
            profileGif: user?.profileGif || '',
            phoneNumber: user?.phoneNumber || '',
            location: (user?.location as string | undefined) || '',
            interests: user?.interests ? (typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests) : [],
            talents: user?.talents ? (typeof user.talents === 'string' ? JSON.parse(user.talents) : user.talents) : [],
            futureMajor: user?.futureMajor || '',
        });
        setIsEditing(false);
    };

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="loading-spinner w-8 h-8"></div>
        </div>;
    }

    return (
        <>
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8"
            >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                    {/* Avatar */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative group"
                    >
                        <div
                            className="w-32 h-32 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-4xl font-bold text-white"
                            style={{ backgroundColor: formData.profileColor }}
                        >
                            {formData.profileGif ? (
                                <img
                                    src={formData.profileGif}
                                    alt="Profile GIF"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                (formData.displayName || formData.name).charAt(0).toUpperCase()
                            )}
                        </div>
                        {isEditing && (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-2 rounded-full transition-all shadow-lg disabled:opacity-50"
                                    title="Tải GIF lên"
                                    aria-label="Tải GIF lên"
                                >
                                    {isUploading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Upload className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                </motion.button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/gif"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    aria-label="Chọn file GIF để tải lên"
                                />
                            </>
                        )}
                    </motion.div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        {/* Name & Email Section */}
                        <div className="space-y-2">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3"
                            >
                                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                                {user.displayName || user.name}
                            </motion.h1>
                            <p className="text-purple-200 text-lg flex items-center justify-center md:justify-start gap-2">
                                <span className="text-purple-300">✉️</span>
                                {user.email}
                            </p>
                            {formData.location && (
                                <p className="text-purple-100 text-base flex items-center justify-center md:justify-start gap-2">
                                    <span className="text-blue-300">📍</span>
                                    <span className="font-medium">Địa điểm:</span> {formData.location}
                                </p>
                            )}
                            {user.phoneNumber && (
                                <p className="text-purple-100 text-base flex items-center justify-center md:justify-start gap-2">
                                    <span className="text-green-400">📞</span>
                                    <span className="font-medium">Số liên lạc:</span> {user.phoneNumber}
                                </p>
                            )}
                        </div>

                        {/* Stats Cards Row - Compact & Optimized */}
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -3 }}
                                className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-500/30 shadow-lg hover:shadow-orange-500/50 transition-all flex items-center gap-2"
                            >
                                <div className="bg-orange-500/20 p-1.5 rounded-lg">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white font-bold text-xl">{user.streak || 0}</span>
                                    <span className="text-orange-200 text-xs font-medium">ngày streak</span>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -3 }}
                                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-500/30 shadow-lg hover:shadow-green-500/50 transition-all flex items-center gap-2"
                            >
                                <div className="bg-green-500/20 p-1.5 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white font-bold text-lg">{(user.balance || 0).toLocaleString('vi-VN')}</span>
                                    <span className="text-green-200 text-xs font-medium">VNĐ</span>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -3 }}
                                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/30 shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                            >
                                <div className="bg-purple-500/20 p-1.5 rounded-lg">
                                    <Award className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white font-bold text-base">
                                        {user.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Edit Button */}
                    <div className="flex space-x-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <Edit3 className="w-5 h-5" />
                            <span>{isEditing ? 'Hủy' : 'Chỉnh sửa'}</span>
                        </motion.button>

                        <Button variant="danger" onClick={logout}>
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Edit Form */}
            {isEditing && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Chỉnh sửa thông tin cá nhân</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Họ và tên
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white input-focus"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tên hiển thị
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white input-focus"
                                    placeholder="Nhập tên hiển thị"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Địa điểm (thành phố/tỉnh)
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white input-focus"
                                    placeholder="VD: Hà Nội, TP. HCM, Đà Nẵng..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Số liên lạc
                                </label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white input-focus"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                                    <Palette className="w-4 h-4 mr-2" />
                                    Màu đại diện
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {predefinedColors.map((color) => (
                                        <motion.button
                                            key={color}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFormData({ ...formData, profileColor: color })}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${formData.profileColor === color
                                                ? 'border-white scale-110 shadow-lg ring-2 ring-purple-500'
                                                : 'border-gray-600 hover:border-purple-400'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                            aria-label={`Chọn màu ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-300 flex items-center">
                                        <Image className="w-4 h-4 mr-2" />
                                        GIF đại diện
                                    </label>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowGifGallery(!showGifGallery)}
                                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {showGifGallery ? 'Ẩn thư viện' : 'Xem thư viện GIF'}
                                    </motion.button>
                                </div>

                                <AnimatePresence>
                                    {showGifGallery && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mb-4 p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl border border-gray-600/50"
                                        >
                                            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                                GIF có sẵn
                                            </h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                                                {predefinedGifs.map((gif, index) => (
                                                    <motion.button
                                                        key={index}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleSelectGif(gif)}
                                                        className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${formData.profileGif === gif
                                                            ? 'border-purple-500 ring-2 ring-purple-500 shadow-lg shadow-purple-500/50'
                                                            : 'border-gray-600 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        <img src={gif} alt={`GIF ${index + 1}`} className="w-full h-full object-cover" />
                                                    </motion.button>
                                                ))}
                                            </div>

                                            {uploadedGifs.length > 0 && (
                                                <>
                                                    <h3 className="text-sm font-medium text-gray-300 mb-3 mt-4 flex items-center gap-2">
                                                        <Upload className="w-4 h-4 text-green-400" />
                                                        GIF đã tải lên ({uploadedGifs.length})
                                                    </h3>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                        {uploadedGifs.map((gif) => (
                                                            <div key={gif.filename} className="relative group">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => handleSelectGif(`http://localhost:3001${gif.url}`)}
                                                                    className={`aspect-square w-full rounded-lg border-2 overflow-hidden transition-all ${formData.profileGif.includes(gif.filename)
                                                                        ? 'border-purple-500 ring-2 ring-purple-500 shadow-lg shadow-purple-500/50'
                                                                        : 'border-gray-600 hover:border-purple-400'
                                                                        }`}
                                                                >
                                                                    <img
                                                                        src={`http://localhost:3001${gif.url}`}
                                                                        alt={gif.filename}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </motion.button>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={() => handleDeleteGif(gif.filename)}
                                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    title="Xóa GIF"
                                                                    aria-label={`Xóa GIF ${gif.filename}`}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </motion.button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={() => setFormData({ ...formData, profileGif: '' })}
                                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                                    title="Xóa GIF đã chọn"
                                >
                                    <X className="w-4 h-4" />
                                    Xóa GIF đã chọn
                                </button>
                            </div>

                            {/* Interests Section */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                                    <Heart className="w-4 h-4 mr-2 text-pink-400" />
                                    Sở thích
                                </label>

                                {/* Selected interests tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.interests.map((interest, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="bg-pink-500/20 border border-pink-500 text-pink-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                                        >
                                            <span>{interest}</span>
                                            <button
                                                onClick={() => removeInterest(interest)}
                                                className="hover:bg-pink-500/30 rounded-full p-0.5 transition-colors"
                                                title="Xóa"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Quick select interests */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {interestOptions.filter(opt => !formData.interests.includes(opt)).slice(0, 8).map((interest) => (
                                        <motion.button
                                            key={interest}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addInterest(interest)}
                                            className="bg-gray-700 hover:bg-pink-500/20 border border-gray-600 hover:border-pink-500 text-gray-300 hover:text-pink-300 px-3 py-1.5 rounded-full text-sm transition-all"
                                        >
                                            <Plus className="w-3 h-3 inline mr-1" />
                                            {interest}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Custom interest input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newInterest}
                                        onChange={(e) => setNewInterest(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm input-focus"
                                        placeholder="Nhập sở thích khác..."
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => addInterest(newInterest)}
                                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </motion.button>
                                </div>
                            </div>

                            {/* Talents Section */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                                    <Award className="w-4 h-4 mr-2 text-yellow-400" />
                                    Năng khiếu / Lĩnh vực giỏi
                                </label>

                                {/* Selected talents tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.talents.map((talent, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                                        >
                                            <span>{talent}</span>
                                            <button
                                                onClick={() => removeTalent(talent)}
                                                className="hover:bg-yellow-500/30 rounded-full p-0.5 transition-colors"
                                                title="Xóa"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Quick select talents */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {talentOptions.filter(opt => !formData.talents.includes(opt)).slice(0, 8).map((talent) => (
                                        <motion.button
                                            key={talent}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addTalent(talent)}
                                            className="bg-gray-700 hover:bg-yellow-500/20 border border-gray-600 hover:border-yellow-500 text-gray-300 hover:text-yellow-300 px-3 py-1.5 rounded-full text-sm transition-all"
                                        >
                                            <Plus className="w-3 h-3 inline mr-1" />
                                            {talent}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Custom talent input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTalent}
                                        onChange={(e) => setNewTalent(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTalent(newTalent)}
                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm input-focus"
                                        placeholder="Nhập năng khiếu khác..."
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => addTalent(newTalent)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </motion.button>
                                </div>
                            </div>

                            {/* Future Major Section */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                                    <GraduationCap className="w-4 h-4 mr-2 text-blue-400" />
                                    Ngành học dự định
                                </label>
                                <input
                                    type="text"
                                    value={formData.futureMajor}
                                    onChange={(e) => setFormData({ ...formData, futureMajor: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white input-focus"
                                    placeholder="VD: Công nghệ thông tin, Kỹ thuật phần mềm, Khoa học dữ liệu..."
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    💡 Thông tin này giúp ContestBot gợi ý các cuộc thi phù hợp với định hướng nghề nghiệp của bạn
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancel}
                                className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg"
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4" />
                                Hủy
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </motion.div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Calendar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex flex-col gap-3 bg-gray-800 rounded-2xl p-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Lịch sự kiện</h2>
                        <button
                            onClick={() => setShowAddEvent(true)}
                            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
                        >
                            Thêm sự kiện
                        </button>
                    </div>
                    <ContestCalendar
                        events={calendarEvents}
                        onDateSelect={(date) => console.log('Selected date:', date)}
                        onEventClick={(event) => console.log('Clicked event:', event)}
                    />
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                <Card className="p-6 text-center card-hover">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                        {isLoadingData ? '...' : registrationCount}
                    </div>
                    <div className="text-gray-300">Cuộc thi đã tham gia</div>
                </Card>

                <Card className="p-6 text-center card-hover">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{user.streak || 0}</div>
                    <div className="text-gray-300">Ngày streak</div>
                </Card>
            </motion.div>
        </div>

        {showAddEvent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Thêm sự kiện</h3>
                        <button onClick={() => setShowAddEvent(false)} className="text-gray-300 hover:text-white">
                            ✕
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Tiêu đề</label>
                            <input
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Tên sự kiện"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Mô tả</label>
                            <textarea
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Thông tin chi tiết (tuỳ chọn)"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Bắt đầu</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                    value={newEvent.startDate}
                                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Kết thúc</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                    value={newEvent.endDate}
                                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setShowAddEvent(false)}
                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleCreateEvent}
                            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ProfilePage;

