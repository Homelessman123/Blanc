import React, { useState } from 'react';
import { CourseReview } from '../types';
import StarRating from './common/StarRating';
import Button from './common/Button';
import { MessageCircle, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

interface CourseReviewsProps {
    reviews: CourseReview[];
    onAddReview?: (review: { rating: number; comment: string }) => void;
    canReview?: boolean;
    submitting?: boolean;
}

const CourseReviews: React.FC<CourseReviewsProps> = ({
    reviews,
    onAddReview,
    canReview = false,
    submitting = false,
}) => {
    const [showAll, setShowAll] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');

    const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

    const handleSubmitReview = () => {
        if (onAddReview && newComment.trim()) {
            onAddReview({ rating: newRating, comment: newComment.trim() });
            setNewComment('');
            setNewRating(5);
            setShowReviewForm(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Đánh giá từ học viên</h3>
                {canReview && (
                    <Button
                        variant="secondary"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                        <MessageCircle size={16} />
                        Viết đánh giá
                    </Button>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Chia sẻ trải nghiệm của bạn</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Đánh giá của bạn
                            </label>
                            <StarRating
                                rating={newRating}
                                interactive
                                onRatingChange={setNewRating}
                                showCount={false}
                                size="lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nhận xét chi tiết
                            </label>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Chia sẻ những gì bạn thích về khóa học này..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={handleSubmitReview} disabled={submitting}>
                                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowReviewForm(false)}
                            >
                                Hủy
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 && (
                    <div className="text-gray-400 text-sm bg-gray-800 border border-dashed border-gray-700 rounded-lg p-4">
                        Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
                    </div>
                )}
                {displayedReviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h5 className="font-semibold text-white">
                                        {review.reviewerName || 'Học viên ẩn danh'}
                                    </h5>
                                    {review.isVerifiedPurchase && (
                                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                            Đã mua khóa học
                                        </span>
                                    )}
                                </div>
                                <StarRating rating={review.rating} showCount={false} size="sm" />
                            </div>
                            <span className="text-xs text-gray-400">
                                {formatDate(review.createdAt)}
                            </span>
                        </div>

                        {review.comment && (
                            <p className="text-gray-300 leading-relaxed">
                                {review.comment}
                            </p>
                        )}

                        {/* Optional: Add helpful button */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700">
                            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                                <ThumbsUp size={14} />
                                Hữu ích
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less Button */}
            {reviews.length > 3 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp size={16} />
                                Ẩn bớt đánh giá
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                Xem thêm {reviews.length - 3} đánh giá
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseReviews;
