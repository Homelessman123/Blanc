import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle, Trophy, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'contest_reminder' | 'payment_success' | 'payout_approved';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

const NotificationSystem: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Mock notifications for demo
    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                type: 'contest_reminder',
                title: 'Cuộc thi sắp hết hạn',
                message: 'Cuộc thi "Olympic Toán học 2025" sẽ kết thúc trong 2 ngày nữa!',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                read: false,
            },
            {
                id: '2',
                type: 'payment_success',
                title: 'Thanh toán thành công',
                message: 'Bạn đã mua thành công khóa học "Luyện thi IELTS 8.0"',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                read: false,
            },
            {
                id: '3',
                type: 'info',
                title: 'Cập nhật mới',
                message: 'ContestHub vừa ra mắt tính năng Calendar để quản lý lịch trình tốt hơn!',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                read: true,
            }
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'contest_reminder':
                return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 'payment_success':
            case 'payout_approved':
                return <DollarSign className="w-5 h-5 text-green-400" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'contest_reminder':
                return 'border-l-yellow-500 bg-yellow-500/10';
            case 'payment_success':
            case 'payout_approved':
            case 'success':
                return 'border-l-green-500 bg-green-500/10';
            case 'warning':
                return 'border-l-yellow-500 bg-yellow-500/10';
            case 'error':
                return 'border-l-red-500 bg-red-500/10';
            default:
                return 'border-l-blue-500 bg-blue-500/10';
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const removeNotification = (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} phút trước`;
        } else if (hours < 24) {
            return `${hours} giờ trước`;
        } else {
            return `${days} ngày trước`;
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
                <Bell className="w-6 h-6 text-gray-300" />
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 md:hidden"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-80 max-w-sm z-50 glass rounded-xl border border-white/20 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Thông báo</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="p-2 space-y-2">
                                        {notifications.map((notification, index) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                onClick={() => !notification.read && markAsRead(notification.id)}
                                                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:bg-white/5 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-white/5' : 'opacity-75'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {getNotificationIcon(notification.type)}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <h4 className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeNotification(notification.id);
                                                                }}
                                                                className="text-gray-400 hover:text-gray-200 ml-2"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>

                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {formatTimestamp(notification.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto mt-2"></div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-400">
                                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Không có thông báo nào</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-white/10">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Xem tất cả thông báo
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationSystem;
