
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Edit3, Camera, Palette, Image, Save, X, Flame, DollarSign, Download, PlusCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ContestCalendar from '../components/ContestCalendar';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
    const { user, updateUser, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        displayName: user?.displayName || user?.name || '',
        profileColor: user?.profileColor || '#6366f1',
        profileGif: user?.profileGif || '',
    });

    const predefinedColors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
        '#f59e0b', '#10b981', '#06b6d4', '#6b7280'
    ];

    const predefinedGifs = [
        'https://media.giphy.com/media/3oKIPEqDGUULpEU0aQ/giphy.gif',
        'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
        'https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif',
        'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
    ];

    const handleSave = () => {
        updateUser(formData);
        setIsEditing(false);
        toast.success('Cập nhật thông tin thành công!');
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            displayName: user?.displayName || user?.name || '',
            profileColor: user?.profileColor || '#6366f1',
            profileGif: user?.profileGif || '',
        });
        setIsEditing(false);
    };

    // Mock calendar events
    const calendarEvents = [
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
    ];

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="loading-spinner w-8 h-8"></div>
        </div>;
    }

    return (
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
                    <div className="relative group">
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
                            <button className="absolute bottom-0 right-0 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {user.displayName || user.name}
                        </h1>
                        <p className="text-purple-200 text-lg mb-4">{user.email}</p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="text-purple-200 text-sm">Streak</span>
                                <div className="text-white font-bold text-xl flex items-center">
                                    <Flame className="w-5 h-5 text-orange-400 mr-1" />
                                    {user.streak || 0} ngày
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="text-purple-200 text-sm">Số dư ví</span>
                                <div className="text-white font-bold text-xl flex items-center">
                                    <DollarSign className="w-5 h-5 text-green-400 mr-1" />
                                    {(user.balance || 0).toLocaleString('vi-VN')} VNĐ
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="text-purple-200 text-sm">Vai trò</span>
                                <div className="text-white font-bold text-xl">
                                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                                </div>
                            </div>
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
                                    <Palette className="w-4 h-4 inline mr-2" />
                                    Màu đại diện
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {predefinedColors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData({ ...formData, profileColor: color })}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${formData.profileColor === color ? 'border-white scale-110' : 'border-gray-500'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Image className="w-4 h-4 inline mr-2" />
                                    GIF đại diện
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {predefinedGifs.map((gif, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setFormData({ ...formData, profileGif: gif })}
                                            className={`w-full h-16 rounded-lg border-2 overflow-hidden transition-all ${formData.profileGif === gif ? 'border-purple-500' : 'border-gray-600'
                                                }`}
                                        >
                                            <img src={gif} alt={`GIF ${index + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, profileGif: '' })}
                                    className="mt-2 text-sm text-gray-400 hover:text-white"
                                >
                                    Xóa GIF
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                            <Button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700">
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                            </Button>
                            <Button onClick={handleSave} className="btn-primary">
                                <Save className="w-4 h-4 mr-2" />
                                Lưu thay đổi
                            </Button>
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
                <ContestCalendar
                    events={calendarEvents}
                    onDateSelect={(date) => console.log('Selected date:', date)}
                    onEventClick={(event) => console.log('Clicked event:', event)}
                />
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <Card className="p-6 text-center card-hover">
                    <div className="text-3xl font-bold text-purple-400 mb-2">5</div>
                    <div className="text-gray-300">Cuộc thi đã tham gia</div>
                </Card>

                <Card className="p-6 text-center card-hover">
                    <div className="text-3xl font-bold text-green-400 mb-2">2</div>
                    <div className="text-gray-300">Khóa học đã mua</div>
                </Card>

                <Card className="p-6 text-center card-hover">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{user.streak || 0}</div>
                    <div className="text-gray-300">Ngày streak</div>
                </Card>
            </motion.div>

            {/* Admin Dashboard */}
            {user.role === 'ADMIN' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="p-6">
                        <h2 className="text-2xl font-bold mb-6 gradient-text">Bảng điều khiển Admin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <h4 className="text-sm text-gray-400">Doanh thu tháng</h4>
                                <p className="text-2xl font-bold text-green-400">
                                    {(15000000).toLocaleString('vi-VN')} VNĐ
                                </p>
                            </div>

                            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                <User className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <h4 className="text-sm text-gray-400">Người dùng mới</h4>
                                <p className="text-2xl font-bold text-blue-400">127</p>
                            </div>

                            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                <Download className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <h4 className="text-sm text-gray-400">Giao dịch hôm nay</h4>
                                <p className="text-2xl font-bold text-purple-400">43</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default ProfilePage;

