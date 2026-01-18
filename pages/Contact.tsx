import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Bug, Info, MessageCircle, Send, Sparkles, User as UserIcon } from 'lucide-react';
import developerAvatar from '../developer.png';
import { Avatar, Badge, Button, Card, Dropdown, Input } from '../components/ui/Common';
import { api } from '../lib/api';

declare const __APP_VERSION__: string | undefined;

type FeedbackType = 'bug' | 'feature' | 'other';

type UserSettings = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone: string;
};

const DEVELOPER = {
    name: 'Trần Hữu Hải Đăng',
    email: 'dangthfcst1147@gmail.com',
    zalo: '0339122620',
    avatar: developerAvatar,
};

const Contact: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserSettings | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const [feedbackType, setFeedbackType] = useState<FeedbackType>('other');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const version = useMemo(() => {
        const raw = (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || import.meta.env.MODE || 'dev';
        const trimmed = String(raw).trim();
        if (!trimmed) return 'dev';
        if (/^[0-9a-f]{7,40}$/i.test(trimmed)) return trimmed;
        return trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
    }, []);

    const feedbackOptions = useMemo(
        () => [
            { value: 'bug', label: 'Báo lỗi', icon: <Bug className="w-4 h-4 text-red-500" /> },
            { value: 'feature', label: 'Đề xuất tính năng', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
            { value: 'other', label: 'Khác', icon: <MessageCircle className="w-4 h-4 text-primary-600" /> },
        ],
        []
    );

    useEffect(() => {
        let isActive = true;

        const fetchUser = async () => {
            setIsLoadingUser(true);
            try {
                const data = await api.get<UserSettings>('/users/me/settings');
                if (!isActive) return;
                setUser(data);
            } catch (err) {
                if (!isActive) return;
                toast.error(err instanceof Error ? err.message : 'Không thể tải thông tin tài khoản');
            } finally {
                if (isActive) setIsLoadingUser(false);
            }
        };

        fetchUser();

        return () => {
            isActive = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (trimmed.length < 10) {
            toast.error('Nội dung tối thiểu 10 ký tự.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/feedback/contact', {
                type: feedbackType,
                message: trimmed,
                version,
                pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
            });
            toast.success('Đã gửi góp ý. Cảm ơn bạn!');
            setMessage('');
            setFeedbackType('other');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Không thể gửi góp ý');
        } finally {
            setIsSubmitting(false);
        }
    };

    const userName = user?.name || (isLoadingUser ? 'Đang tải...' : '—');
    const userEmail = user?.email || (isLoadingUser ? 'Đang tải...' : '—');
    const userPhone = user?.phone || (isLoadingUser ? 'Đang tải...' : '—');

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center border border-primary-100">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Hỗ trợ & góp ý</h1>
                            <p className="text-sm text-slate-500">Gửi phản hồi trực tiếp tới nhà phát triển.</p>
                        </div>
                    </div>
                    <Button type="button" variant="ghost" className="gap-2 self-start" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <h2 className="font-semibold text-slate-900">Thông tin của bạn</h2>
                            </div>
                            <Badge className="bg-primary-50 text-primary-700 border border-primary-100">Đã đăng nhập</Badge>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Avatar
                                src={user?.avatar || undefined}
                                name={user?.name || 'User'}
                                size="xl"
                                className="ring-4 ring-primary-100 shadow-sm w-28 h-28"
                            />
                        </div>

                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Tài khoản</span>
                                <span className="text-slate-900 font-semibold text-right">{userName}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Email</span>
                                <span className="text-slate-900 font-semibold text-right">{userEmail}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Số điện thoại</span>
                                <span className="text-slate-900 font-semibold text-right">{userPhone}</span>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="text-xs text-slate-600">
                                <div className="font-medium">Email/SDT được lấy từ hồ sơ</div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile?tab=settings&settingsTab=profile')}
                                    className="text-primary-700 font-semibold hover:underline"
                                >
                                    Bạn có thể cập nhật trong trang Tôi
                                </button>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            className="mt-4 w-full"
                            onClick={() => navigate('/profile?tab=settings&settingsTab=profile')}
                        >
                            Cập nhật hồ sơ
                        </Button>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <h2 className="font-semibold text-slate-900">Thông tin nhà phát triển</h2>
                            </div>
                            <Badge className="bg-pink-50 text-pink-700 border border-pink-100">Admin</Badge>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Avatar
                                src={DEVELOPER.avatar}
                                name={DEVELOPER.name}
                                size="xl"
                                className="ring-4 ring-primary-200 shadow-sm w-28 h-28"
                            />
                        </div>

                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Tên</span>
                                <span className="text-slate-900 font-semibold text-right">{DEVELOPER.name}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Email</span>
                                <span className="text-slate-900 font-semibold text-right">{DEVELOPER.email}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-slate-500">Zalo</span>
                                <span className="text-slate-900 font-semibold text-right">{DEVELOPER.zalo}</span>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="text-xs text-slate-600">
                                <div className="font-medium">Bạn hãy liên hệ tôi nếu có bất kỳ thắc mắc nào nhé</div>
                                <div className="text-primary-700 font-semibold">Mình luôn ở đây lắng nghe bạn</div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="mt-6 p-6">
                    <h2 className="text-lg font-bold text-slate-900">Gửi góp ý</h2>

                    <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Dropdown
                                headerText="Phân loại"
                                label="Phân loại"
                                options={feedbackOptions}
                                value={feedbackType}
                                onChange={(value) => setFeedbackType(value as FeedbackType)}
                            />
                            <Input label="Phiên bản trang web" value={version} disabled />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                maxLength={2000}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                                placeholder="Mô tả vấn đề / góp ý của bạn..."
                                disabled={isSubmitting}
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                <span>Tối thiểu 10 ký tự.</span>
                                <span>{message.length}/2000</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
                                Đóng
                            </Button>
                            <Button type="submit" className="gap-2" disabled={isSubmitting}>
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'Đang gửi' : 'Gửi'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Contact;
