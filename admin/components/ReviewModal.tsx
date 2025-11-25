import React from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import type { CourseReview } from '../../types';

interface ReviewModalProps {
  open: boolean;
  title: string;
  reviews: CourseReview[];
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ open, title, reviews, onClose }) => {
  if (!open) return null;

  const safeReviews = reviews || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Đánh giá - {title}</h3>
            <p className="text-sm text-slate-500">{safeReviews.length} đánh giá</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {safeReviews.length === 0 && (
            <div className="p-6 text-slate-500 text-sm text-center">Chưa có đánh giá nào.</div>
          )}
          {safeReviews.map((review) => {
            const displayName = review.reviewerName || 'Học viên ẩn danh';
            const displayEmail = review.reviewerId && review.reviewerId.includes('@') ? review.reviewerId : 'Không có email';

            return (
              <div key={review.id} className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-slate-800">{displayName}</div>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} /> Đã mua
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star size={16} className="fill-amber-400 text-amber-400" /> {review.rating.toFixed(1)}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{displayEmail}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{review.comment || 'Không có nhận xét chi tiết.'}</p>
                <div className="text-xs text-slate-400">
                  {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
