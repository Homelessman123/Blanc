import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    reviewCount?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    reviewCount,
    size = 'md',
    showCount = true,
    interactive = false,
    onRatingChange
}) => {
    const sizeMap = {
        sm: 14,
        md: 16,
        lg: 20
    };

    const starSize = sizeMap[size];
    const textSize = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }[size];

    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            const isFull = i <= fullStars;
            const isHalf = i === fullStars + 1 && hasHalfStar;

            stars.push(
                <div key={i} className="relative">
                    <Star
                        size={starSize}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
                            } ${isFull || isHalf ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                            }`}
                        onClick={interactive ? () => onRatingChange?.(i) : undefined}
                    />
                    {isHalf && (
                        <div className="absolute inset-0 overflow-hidden w-1/2">
                            <Star
                                size={starSize}
                                className="text-yellow-400 fill-yellow-400"
                            />
                        </div>
                    )}
                </div>
            );
        }
        return stars;
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {renderStars()}
            </div>
            {showCount && (
                <div className=" text-gray-400">
                    <span className="font-semibold text-yellow-400"></span>
                    {reviewCount !== undefined && (
                        <span> ({reviewCount} đánh giá)</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StarRating;
