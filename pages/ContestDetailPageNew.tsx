import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import SuccessToast from '../components/SuccessToast';
import {
    Calendar,
    ArrowLeft,
    CheckCircle,
    Award,
    Users,
    Clock,
    DollarSign,
    Wifi,
    MapPin,
    GraduationCap,
    Phone,
    Mail,
    MapPinned,
    Globe,
    Facebook,
    ExternalLink
} from 'lucide-react';

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;
import type { Contest, ContestScheduleItem, ContestJudge, ContestPartner } from '../types';
import { contestAPI } from '../services/api';
import { mapContestFromApi } from '../utils/contestUtils';

const ContestDetailPageNew: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isAddedToCalendar, setIsAddedToCalendar] = useState(false);

    useEffect(() => {
        fetchContestDetail();
    }, [id]);

    const fetchContestDetail = async () => {
        try {
            setLoading(true);
            setNotFound(false);
            if (!id) return;
            const response = await contestAPI.getById(id);
            const data = response.data?.contest || response.data;
            const mapped = mapContestFromApi(data);

            if (mapped.status && mapped.status !== 'PUBLISHED') {
                setNotFound(true);
                setContest(null);
                return;
            }

            setContest(mapped);
        } catch (error) {
            console.error('Error fetching contest:', error);
            setNotFound(true);
            setContest(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCalendar = () => {
        setIsAddedToCalendar(!isAddedToCalendar);
        // In real app, would add to user's calendar
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Đang tải thông tin cuộc thi...</p>
                </div>
            </div>
        );
    }

    if (!contest || notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy cuộc thi</h2>
                    <Button onClick={() => navigate('/contests')}>
                        Quay lại danh sách cuộc thi
                    </Button>
                </div>
            </div>
        );
    }

    const deadline = new Date(contest.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/contests')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Quay lại danh sách cuộc thi
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Contest Header */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                        <img
                            src={contest.imageUrl}
                            alt={contest.title}
                            className="w-full h-64 object-cover"
                        />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                {contest.tags?.map(tag => (
                                    <span key={tag} className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-3">{contest.title}</h1>
                            <p className="text-lg text-gray-400 mb-4">Tổ chức bởi: {contest.organization}</p>

                            <p className="text-gray-300 leading-relaxed">{contest.description}</p>
                        </div>
                    </div>

                    {/* Contest Info */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Thông tin cuộc thi</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center text-gray-300">
                                <DollarSign size={20} className="mr-3 text-blue-400" />
                                <div>
                                    <div className="font-semibold">Chi phí</div>
                                    <div className="text-sm text-gray-400">
                                        {contest.fee === 0 || !contest.fee ? "Miễn phí" : formatCurrency(contest.fee || 0)}
                                    </div>
                                </div>
                            </div>

                            {contest.format && (
                                <div className="flex items-center text-gray-300">
                                    {contest.format === 'ONLINE' ? <Wifi size={20} className="mr-3 text-blue-400" /> :
                                        contest.format === 'OFFLINE' ? <MapPin size={20} className="mr-3 text-blue-400" /> :
                                            <Globe size={20} className="mr-3 text-blue-400" />}
                                    <div>
                                        <div className="font-semibold">Hình thức</div>
                                        <div className="text-sm text-gray-400">
                                            {contest.format === 'ONLINE' ? 'Trực tuyến' :
                                                contest.format === 'OFFLINE' ? 'Trực tiếp' : 'Kết hợp'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {contest.targetGrade && (
                                <div className="flex items-center text-gray-300">
                                    <GraduationCap size={20} className="mr-3 text-blue-400" />
                                    <div>
                                        <div className="font-semibold">Đối tượng</div>
                                        <div className="text-sm text-gray-400">{contest.targetGrade}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center text-gray-300">
                                <Calendar size={20} className="mr-3 text-blue-400" />
                                <div>
                                    <div className="font-semibold">Hạn đăng ký</div>
                                    <div className="text-sm text-gray-400">
                                        {deadline.toLocaleDateString('vi-VN')}
                                        <span className={`ml-2 ${daysLeft > 10 ? 'text-green-400' : 'text-orange-400'}`}>
                                            (Còn {daysLeft} ngày)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    {contest.benefits && contest.benefits.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Lợi ích khi tham gia</h2>
                            <div className="space-y-3">
                                {contest.benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start text-gray-300">
                                        <CheckCircle size={20} className="mr-3 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span>{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Eligibility */}
                    {contest.eligibility && contest.eligibility.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Điều kiện tham gia</h2>
                            <div className="space-y-3">
                                {contest.eligibility.map((requirement, index) => (
                                    <div key={index} className="flex items-start text-gray-300">
                                        <Users size={20} className="mr-3 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <span>{requirement}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule */}
                    {contest.schedule && contest.schedule.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Lịch trình cuộc thi</h2>
                            <div className="space-y-4">
                                {contest.schedule.map((item: ContestScheduleItem, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className="bg-blue-600 text-white rounded-lg p-3 text-center">
                                                <div className="text-xs">Tháng {new Date(item.date).getMonth() + 1}</div>
                                                <div className="text-2xl font-bold">{new Date(item.date).getDate()}</div>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="text-sm text-gray-400">{item.time}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{item.activity}</h3>
                                            <p className="text-sm text-gray-400">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Judges */}
                    {contest.judges && contest.judges.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Ban giám khảo</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {contest.judges.map((judge: ContestJudge, index) => (
                                    <div key={index} className="flex gap-4 p-4 bg-gray-700/50 rounded-lg">
                                        <img
                                            src={judge.avatar}
                                            alt={judge.name}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-white">{judge.name}</h3>
                                            <p className="text-sm text-blue-400 mb-1">{judge.title}</p>
                                            <p className="text-xs text-gray-400">{judge.bio}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Partners */}
                    {contest.partners && contest.partners.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Đối tác & Nhà tài trợ</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {contest.partners.map((partner: ContestPartner, index) => (
                                    <a
                                        key={index}
                                        href={partner.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group"
                                    >
                                        <img
                                            src={partner.logo}
                                            alt={partner.name}
                                            className="h-16 object-contain mb-3"
                                        />
                                        <h3 className="font-bold text-white text-center mb-1 group-hover:text-blue-400">
                                            {partner.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 text-center">{partner.type}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    {contest.contactInfo && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Thông tin liên hệ</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {contest.contactInfo.email && (
                                    <a
                                        href={`mailto:${contest.contactInfo.email}`}
                                        className="flex items-center text-gray-300 hover:text-blue-400 transition-colors"
                                    >
                                        <Mail size={20} className="mr-3 text-blue-400" />
                                        <span>{contest.contactInfo.email}</span>
                                    </a>
                                )}
                                {contest.contactInfo.phone && (
                                    <a
                                        href={`tel:${contest.contactInfo.phone}`}
                                        className="flex items-center text-gray-300 hover:text-blue-400 transition-colors"
                                    >
                                        <Phone size={20} className="mr-3 text-blue-400" />
                                        <span>{contest.contactInfo.phone}</span>
                                    </a>
                                )}
                                {contest.contactInfo.address && (
                                    <div className="flex items-start text-gray-300">
                                        <MapPinned size={20} className="mr-3 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span>{contest.contactInfo.address}</span>
                                    </div>
                                )}
                                {contest.contactInfo.website && (
                                    <a
                                        href={contest.contactInfo.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-gray-300 hover:text-blue-400 transition-colors"
                                    >
                                        <Globe size={20} className="mr-3 text-blue-400" />
                                        <span>Website</span>
                                    </a>
                                )}
                                {contest.contactInfo.facebook && (
                                    <a
                                        href={contest.contactInfo.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-gray-300 hover:text-blue-400 transition-colors"
                                    >
                                        <Facebook size={20} className="mr-3 text-blue-400" />
                                        <span>Facebook</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-24">
                        <div className="text-center mb-6">
                            <div className="text-3xl font-bold text-sky-300 mb-2">
                                {contest.fee === 0 || !contest.fee ? "Miễn phí" : formatCurrency(contest.fee || 0)}
                            </div>
                            <div className="text-gray-400">Phí tham gia</div>
                        </div>

                        <div className="space-y-4">
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleAddToCalendar}
                            >
                                {isAddedToCalendar ? (
                                    <>
                                        <CheckCircle size={18} className="text-green-400" />
                                        Đã thêm vào lịch
                                    </>
                                ) : (
                                    <>
                                        <Calendar size={18} />
                                        Thêm vào lịch
                                    </>
                                )}
                            </Button>

                            {contest.website && (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => window.open(contest.website, '_blank')}
                                >
                                    <Globe size={18} />
                                    Truy cập website
                                </Button>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <div className="text-sm text-gray-400 space-y-2">
                                <div className="flex items-center">
                                    <CheckCircle size={16} className="mr-2 text-green-400" />
                                    Đăng ký nhanh chóng
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle size={16} className="mr-2 text-green-400" />
                                    Xác nhận qua email
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle size={16} className="mr-2 text-green-400" />
                                    Hỗ trợ 24/7
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle size={16} className="mr-2 text-green-400" />
                                    Chứng chỉ điện tử
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            <SuccessToast
                isVisible={showSuccessToast}
                onClose={() => setShowSuccessToast(false)}
                contestTitle={contest.title}
            />
        </div>
    );
};

export default ContestDetailPageNew;
