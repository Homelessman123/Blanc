
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronDown, Check, Trophy, Users, Info, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './ui/Common';
import { User, Notification } from '../types';
import { api } from '../lib/api';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const navItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Cuộc thi', path: '/contests' },
    { name: 'Khóa học', path: '/marketplace' },
    { name: 'Cộng đồng', path: '/community' },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoadingNotifs(true);
    try {
      const data = await api.get<{ notifications: Notification[] }>('/users/me/notifications-history?limit=10');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // Fallback to empty array on error
      setNotifications([]);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [user]);

  // Fetch notifications when user logs in or component mounts
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIconByType = (type: string) => {
    switch (type) {
      case 'reward': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'invite': return <Users className="w-5 h-5 text-blue-500" />;
      case 'course':
      case 'courseUpdate': return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'contestReminder':
      case 'contestRegistration': return <Trophy className="w-5 h-5 text-primary-500" />;
      case 'announcement': return <Info className="w-5 h-5 text-blue-500" />;
      case 'welcome': return <Trophy className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold mr-2">
                C
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                ContestHub
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Auth/Profile Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Notification Bell with Dropdown */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className={`relative p-2 transition-colors rounded-full hover:bg-slate-100 ${isNotifOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500'}`}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-white"></span>
                      )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animation-fade-in z-50 origin-top-right">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                          <h3 className="font-bold text-slate-900">Thông báo</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center"
                            >
                              <Check className="w-3 h-3 mr-1" /> Đánh dấu đã đọc
                            </button>
                          )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {isLoadingNotifs ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                            </div>
                          ) : notifications.length > 0 ? (
                            <div className="py-1">
                              {notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
                                >
                                  <div className="flex gap-3">
                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                      {getIconByType(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex justify-between items-start">
                                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                          {notif.title}
                                        </p>
                                        {!notif.isRead && (
                                          <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-medium pt-1">
                                        {notif.time || formatTimeAgo(notif.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-500">
                              <Bell className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                              <p className="text-sm">Bạn chưa có thông báo nào</p>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                          <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            Xem tất cả
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <button className="flex items-center space-x-2 focus:outline-none">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      />
                      <span className="text-sm font-medium text-slate-700">{user.name}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-40">
                      <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-xs text-slate-500">Đăng nhập với</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <NavLink to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                        <UserIcon className="w-4 h-4 mr-2 text-slate-400" /> Hồ sơ
                      </NavLink>
                      <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <NavLink to="/login">
                    <Button variant="ghost" size="sm">Đăng nhập</Button>
                  </NavLink>
                  <NavLink to="/register">
                    <Button size="sm">Bắt đầu học</Button>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-500 hover:text-slate-700 focus:outline-none p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              {user ? (
                <>
                  <div className="border-t border-slate-100 my-2 pt-2">
                    <div className="px-3 py-2 flex items-center justify-between text-slate-600">
                      <span className="font-medium">Thông báo</span>
                      {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} mới</span>}
                    </div>
                  </div>
                  <NavLink to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">
                    Hồ sơ cá nhân
                  </NavLink>
                  <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="pt-4 flex flex-col space-y-2 px-3">
                  <NavLink to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="secondary" className="w-full justify-center">Đăng nhập</Button>
                  </NavLink>
                  <NavLink to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-center">Đăng ký ngay</Button>
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold mr-2">C</div>
                <span className="text-xl font-bold text-slate-900">ContestHub</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nền tảng kết nối tri thức, nâng tầm bản thân qua các cuộc thi và khóa học chất lượng cao.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Nền tảng</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Về chúng tôi</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Cuộc thi</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Khóa học</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Đối tác</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Hỗ trợ</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Điều khoản sử dụng</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Chính sách bảo mật</a></li>
                <li><a href="#" className="text-slate-500 hover:text-primary-600 text-sm">Liên hệ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Liên hệ</h3>
              <ul className="space-y-3">
                <li className="text-slate-500 text-sm">contact@contesthub.com</li>
                <li className="text-slate-500 text-sm">+84 123 456 789</li>
                <li className="flex space-x-4 mt-4">
                  {/* Social Placeholders */}
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer">
                    <span className="sr-only">Facebook</span>f
                  </div>
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer">
                    <span className="sr-only">Twitter</span>t
                  </div>
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer">
                    <span className="sr-only">LinkedIn</span>in
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">© 2024 ContestHub. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-slate-400 text-sm">Made with ❤️ for Education</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
