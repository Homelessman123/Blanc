import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Course } from '../types';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import CourseReviews from '../components/CourseReviews';
import { useAuth } from '../contexts/AuthContext';
import {
    ShoppingCart,
    Clock,
    Award,
    Globe,
    Users,
    ArrowLeft,
    BookOpen,
    Download,
    CheckCircle
} from 'lucide-react';
import { productAPI } from '../services/api';
import { mapProductFromApi, mapProductToCourse } from '../utils/productUtils';

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

const CourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setNotFound(false);
                const response = await productAPI.getById(id);
                const product = mapProductFromApi(response.data);
                if (product.status && product.status !== 'PUBLISHED') {
                    setNotFound(true);
                    setCourse(null);
                    return;
                }
                setCourse(mapProductToCourse(product));
            } catch (error: any) {
                console.error('Failed to load course', error);
                setNotFound(true);
                setCourse(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Đang tải thông tin tài liệu...</p>
                </div>
            </div>
        );
    }

    if (!course || notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy khóa học</h2>
                    <Button onClick={() => navigate('/marketplace')}>
                        Quay lại Marketplace
                    </Button>
                </div>
            </div>
        );
    }

    const levelLabels = {
        BEGINNER: 'Cơ bản',
        INTERMEDIATE: 'Trung cấp',
        ADVANCED: 'Nâng cao',
        EXPERT: 'Chuyên gia'
    };

    const features = [
        'Học tập trực tuyến linh hoạt',
        'Tài liệu học tập đầy đủ',
        'Hỗ trợ từ giảng viên',
        'Chứng chỉ hoàn thành',
        'Cập nhật nội dung thường xuyên'
    ];

    const handleAddReview = async (reviewData: { rating: number; comment: string }) => {
        if (!course || submittingReview) return;
        setSubmittingReview(true);
        try {
            const reviewerName = user?.displayName || user?.name || user?.email || 'Học viên';
            // Ưu tiên gửi email làm định danh để admin thấy rõ ai đã đánh giá
            const reviewerId = user?.email || user?.id || 'anonymous';

            const response = await productAPI.addReview(course.id, {
                ...reviewData,
                reviewerName,
                reviewerId,
            });

            const newReview =
                response.data?.review || {
                    ...reviewData,
                    reviewerName,
                    reviewerId,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                };
            const nextRating = response.data?.rating ?? course.rating;
            const nextReviewCount = response.data?.reviewCount ?? ((course.reviewCount || 0) + 1);
            setCourse((prev) =>
                prev
                    ? {
                        ...prev,
                        rating: nextRating,
                        reviewCount: nextReviewCount,
                        reviews: [newReview as any, ...(prev.reviews || [])],
                    }
                    : prev
            );
        } catch (error) {
            console.error('Failed to add review', error);
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Quay lại Marketplace
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Course Header */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                        <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-64 object-cover"
                        />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                                    {course.type}
                                </span>
                                {course.level && (
                                    <span className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                        <Award size={14} />
                                        {levelLabels[course.level]}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
                            <p className="text-lg text-gray-400 mb-4">Giảng viên: {course.author}</p>

                            {course.rating && (
                                <div className="mb-4">
                                    <StarRating
                                        rating={course.rating}
                                        reviewCount={course.reviewCount}
                                        size="lg"
                                    />
                                </div>
                            )}

                            <p className="text-gray-300 leading-relaxed">{course.description}</p>
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Thông tin khóa học</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {course.duration && (
                                <div className="flex items-center text-gray-300">
                                    <Clock size={20} className="mr-3 text-blue-400" />
                                    <div>
                                        <div className="font-semibold">Thời lượng</div>
                                        <div className="text-sm text-gray-400">{course.duration}</div>
                                    </div>
                                </div>
                            )}

                            {course.language && (
                                <div className="flex items-center text-gray-300">
                                    <Globe size={20} className="mr-3 text-blue-400" />
                                    <div>
                                        <div className="font-semibold">Ngôn ngữ</div>
                                        <div className="text-sm text-gray-400">{course.language}</div>
                                    </div>
                                </div>
                            )}

                            {course.level && (
                                <div className="flex items-center text-gray-300">
                                    <Award size={20} className="mr-3 text-blue-400" />
                                    <div>
                                        <div className="font-semibold">Cấp độ</div>
                                        <div className="text-sm text-gray-400">{levelLabels[course.level]}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center text-gray-300">
                                <Users size={20} className="mr-3 text-blue-400" />
                                <div>
                                    <div className="font-semibold">Đã học</div>
                                    <div className="text-sm text-gray-400">{course.reviewCount || 0}+ học viên</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Features */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Bạn sẽ nhận được</h2>
                        <div className="space-y-3">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center text-gray-300">
                                    <CheckCircle size={20} className="mr-3 text-green-400" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <CourseReviews
                            reviews={course.reviews || []}
                            onAddReview={handleAddReview}
                            canReview={true}
                            submitting={submittingReview}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-24">
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-sky-300 mb-2">
                                {formatCurrency(course.price)}
                            </div>
                            <div className="text-gray-400">Thanh toán một lần</div>
                        </div>

                        <div className="space-y-4">
                            <Button
                                variant="secondary"
                                className="w-full"
                            >
                                <BookOpen size={18} />
                                Xem trước khóa học
                            </Button>

                            {course.type === 'PDF Document' && (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Download size={18} />
                                    Tải mẫu PDF
                                </Button>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <div className="text-sm text-gray-400 space-y-2">
                                <div>✓ Truy cập trọn đời</div>
                                <div>✓ Hỗ trợ 24/7</div>
                                <div>✓ Chứng chỉ hoàn thành</div>
                                <div>✓ Hoàn tiền trong 30 ngày</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
