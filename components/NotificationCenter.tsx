import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    createdAt: string;
}

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-lg" />;
            case 'WARNING':
                return <AlertCircle className="w-5 h-5 text-amber-400 drop-shadow-lg" />;
            case 'ERROR':
                return <AlertCircle className="w-5 h-5 text-red-400 drop-shadow-lg" />;
            default:
                return <Info className="w-5 h-5 text-blue-400 drop-shadow-lg" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return 'border-l-green-400 bg-green-900/20';
            case 'WARNING':
                return 'border-l-amber-400 bg-amber-900/20';
            case 'ERROR':
                return 'border-l-red-400 bg-red-900/20';
            default:
                return 'border-l-blue-400 bg-blue-900/20';
        }
    };

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 rounded-xl hover:bg-gray-700/60 transition-all duration-200 border border-gray-600/30 backdrop-blur"
            >
                <Bell className="w-6 h-6 text-gray-200" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-red-400"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl backdrop-blur-xl z-50 max-h-96 overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(75, 85, 99, 0.3)'
                        }}
                    >
                        <div className="p-4 border-b-2 border-gray-600 flex items-center justify-between bg-gray-800/50 backdrop-blur">
                            <h3 className="font-bold text-lg text-white">Thông báo</h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllAsRead}
                                        className="text-sm font-semibold text-purple-300 hover:text-purple-200 px-2 py-1 rounded-md hover:bg-purple-800/30 transition-all"
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                                    title="Đóng"
                                    aria-label="Đóng thông báo"
                                >
                                    <X className="w-5 h-5 text-gray-300" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-300 font-medium">
                                    Không có thông báo nào
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${!notification.isRead ? 'bg-gray-800/80 font-semibold' : 'bg-gray-800/40'
                                            } hover:bg-gray-700/60 transition-all duration-200 border-b border-gray-700/50`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {getIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm text-white ${!notification.isRead ? 'text-white' : 'text-gray-200'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-200 font-medium' : 'text-gray-300'}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2 font-medium">
                                                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => onMarkAsRead(notification.id)}
                                                        className="p-2 hover:bg-green-600/30 rounded-lg border border-green-500/30 transition-all"
                                                        title="Đánh dấu đã đọc"
                                                    >
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDelete(notification.id)}
                                                    className="p-2 hover:bg-red-600/30 rounded-lg text-red-400 border border-red-500/30 transition-all"
                                                    title="Xóa"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
