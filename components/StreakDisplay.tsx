import React from 'react';
import { Flame } from 'lucide-react';
import './StreakDisplay.css';

interface StreakDisplayProps {
    streak: number;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    animate?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
    streak,
    size = 'medium',
    showLabel = false,
    animate = true
}) => {
    const sizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-xl'
    };

    const iconSizes = {
        small: 16,
        medium: 20,
        large: 28
    };

    const getStreakColor = (count: number) => {
        if (count >= 30) return 'text-red-500'; // Red fire for 30+ days
        if (count >= 14) return 'text-orange-500'; // Orange fire for 14+ days
        if (count >= 7) return 'text-orange-400'; // Light orange for 7+ days
        if (count >= 3) return 'text-yellow-500'; // Yellow for 3+ days
        return 'text-yellow-400'; // Light yellow for starting
    };

    const getStreakMessage = (count: number) => {
        if (count === 0) return 'Bắt đầu streak của bạn!';
        if (count === 1) return 'Bắt đầu tốt!';
        if (count < 7) return 'Tiếp tục phát huy!';
        if (count < 14) return 'Tuyệt vời! 🎉';
        if (count < 30) return 'Thật kiên định! 💪';
        if (count < 100) return 'Huyền thoại! 🔥';
        return 'Vô địch! 👑';
    };

    return (
        <div
            className={`streak-display flex items-center gap-1 ${sizeClasses[size]} font-bold ${getStreakColor(streak)}`}
            title={`${streak} ngày liên tục - ${getStreakMessage(streak)}`}
        >
            <Flame
                size={iconSizes[size]}
                className={animate && streak > 0 ? 'streak-flame' : ''}
                fill="currentColor"
            />
            <span className={animate && streak > 0 ? 'streak-count' : ''}>
                {streak}
            </span>
            {showLabel && (
                <span className="text-gray-400 text-xs ml-1">
                    {streak === 1 ? 'ngày' : 'ngày'}
                </span>
            )}
        </div>
    );
};

export default StreakDisplay;
