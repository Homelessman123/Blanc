
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Contest, Course } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import SuccessToast from '../components/SuccessToast';
import { Calendar, Tag, AlertTriangle, CheckCircle, BookOpen, Clock, Award, Globe, Eye, DollarSign, Wifi, MapPin, GraduationCap, ExternalLink } from 'lucide-react';
import { contestAPI } from '../services/api';
import { mapProductListToCourses } from '../utils/productUtils';
import { mapContestFromApi } from '../utils/contestUtils';

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

const RecommendedCourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const levelLabels = {
        BEGINNER: 'Cơ bản',
        INTERMEDIATE: 'Trung cấp',
        ADVANCED: 'Nâng cao',
        EXPERT: 'Chuyên gia'
    };

    return (
        <Card className="flex flex-col h-full group">
            <div className="relative">
                <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded-md text-xs font-semibold">
                    {course.type}
                </div>
                {course.level && (
                    <div className="absolute top-2 right-2 bg-blue-600/80 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                        <Award size={12} />
                        {levelLabels[course.level]}
                    </div>
                )}

                {/* View Details Overlay */}
                <Link
                    to={`/courses/${course.id}`}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <Eye size={24} className="text-white" />
                    </div>
                </Link>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/courses/${course.id}`}>
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 hover:text-sky-400 transition-colors cursor-pointer">{course.title}</h3>
                </Link>
                <p className="text-sm text-gray-400 mb-2">by {course.author}</p>

                {/* Rating */}
                {course.rating && (
                    <div className="mb-3">
                        <StarRating
                            rating={course.rating}
                            reviewCount={course.reviewCount}
                            size="sm"
                        />
                    </div>
                )}

                <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">{course.description}</p>

                {/* Course Info */}
                <div className="space-y-2 mb-4">
                    {course.duration && (
                        <div className="flex items-center text-xs text-gray-400">
                            <Clock size={14} className="mr-2" />
                            Thời lượng: {course.duration}
                        </div>
                    )}
                    {course.language && (
                        <div className="flex items-center text-xs text-gray-400">
                            <Globe size={14} className="mr-2" />
                            Ngôn ngữ: {course.language}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-auto">
                    <div className="text-xl font-bold text-sky-300">
                        {formatCurrency(course.price)}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ContestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [contest, setContest] = useState<Contest | null>(null);
    const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContest = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await contestAPI.getById(id);
                const contestData = response.data?.contest;
                if (!contestData) {
                    setContest(null);
                    setRelatedCourses([]);
                    return;
                }
                const mapped = mapContestFromApi(contestData);
                setContest(mapped);
                const suggested = mapped.suggestedProducts || [];
                setRelatedCourses(mapProductListToCourses(suggested));
            } catch (error) {
                console.error('Failed to fetch contest detail', error);
                setContest(null);
            } finally {
                setLoading(false);
            }
        };

        loadContest();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Đang tải thông tin cuộc thi...</p>
                </div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="mx-auto text-yellow-400" size={48} />
                <h1 className="mt-4 text-3xl font-bold">Contest Not Found</h1>
                <p className="text-gray-400">The contest you are looking for does not exist.</p>
            </div>
        );
    }

    const deadline = new Date(contest.deadline);
    const deadline = new Date(contest.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

    const handleJoin = () => {
        // Toggle calendar state
        setIsJoined(!isJoined);
    };

    return (
        <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="p-0">
                        <img src={contest.imageUrl} alt={contest.title} className="w-full h-96 object-cover rounded-t-xl" />
                        <div className="p-8">
                            <h1 className="text-4xl font-extrabold text-white mb-2">{contest.title}</h1>
                            <p className="text-lg text-sky-400 font-semibold mb-6">{contest.organization}</p>
                            <p className="text-gray-300 leading-relaxed">{contest.description}</p>
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-sky-500/20">
                        <h3 className="text-xl font-bold mb-4 text-sky-400">Thông tin cuộc thi</h3>
                        <div className="space-y-4 text-gray-300">
                            {/* Fee */}
                            <div className="flex items-center bg-gradient-to-r from-sky-500/10 to-blue-600/10 p-3 rounded-lg border border-sky-500/20">
                                <DollarSign size={20} className="mr-3 text-sky-400 flex-shrink-0" />
                                <div>
                                    <span className="text-sm text-gray-400">Chi phí:</span>
                                    <div className="text-2xl font-bold text-sky-400">
                                        {contest.fee === 0 ? "Miễn phí" : formatCurrency(contest.fee || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Format */}
                            {contest.format && (
                                <div className="flex items-center bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                                    {contest.format === 'ONLINE' ? <Wifi size={20} className="mr-3 text-purple-400" /> :
                                        contest.format === 'OFFLINE' ? <MapPin size={20} className="mr-3 text-purple-400" /> :
                                            <Globe size={20} className="mr-3 text-purple-400" />}
                                    <div>
                                        <span className="text-sm text-gray-400">Hình thức:</span>
                                        <div className="font-bold text-purple-400">
                                            {contest.format === 'ONLINE' ? 'Trực tuyến' :
                                                contest.format === 'OFFLINE' ? 'Trực tiếp' :
                                                    'Kết hợp'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Grade */}
                            {contest.targetGrade && (
                                <div className="flex items-center bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                    <GraduationCap size={20} className="mr-3 text-green-400 flex-shrink-0" />
                                    <div>
                                        <span className="text-sm text-gray-400">Đối tượng:</span>
                                        <div className="font-bold text-green-400">{contest.targetGrade}</div>
                                    </div>
                                </div>
                            )}

                            {/* Deadline */}
                            <div className="flex items-start bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <Calendar size={20} className="mr-3 mt-1 text-red-400 flex-shrink-0" />
                                <div>
                                    <span className="text-sm text-gray-400">Hạn đăng ký:</span>
                                    <div className="font-bold text-white">{deadline.toLocaleDateString('vi-VN')}</div>
                                    <span className={`text-sm font-bold ${daysLeft > 10 ? 'text-green-400' : 'text-orange-400'}`}>
                                        Còn {daysLeft} ngày
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-start">
                                <Tag size={20} className="mr-3 mt-1 text-sky-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="text-sm text-gray-400">Danh mục:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {contest.tags.map(tag => (
                                            <span key={tag} className="bg-gray-700/50 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-gray-600/50 transition-colors">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-3">
                            <Button
                                onClick={handleJoin}
                                className={`w-full ${isJoined ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'} transition-all duration-300`}
                            >
                                {isJoined ? (
                                    <>
                                        <CheckCircle size={20} /> Đã thêm vào lịch
                                    </>
                                ) : (
                                    <>
                                        <Calendar size={20} /> Thêm vào lịch
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {relatedCourses.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><BookOpen /> Khóa học gợi ý</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedCourses.map(course => (
                            <RecommendedCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            )}

            {/* Success Toast */}
            <SuccessToast
                isVisible={showSuccessToast}
                onClose={() => setShowSuccessToast(false)}
                contestTitle={contest.title}
            />
        </div>
    );
};

export default ContestDetailPage;
