import React, { useEffect } from 'react';
import { CheckCircle, X, Sparkles, MessageCircle } from 'lucide-react';

interface CuteToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
    icon?: 'success' | 'chat';
}

export const CuteToast: React.FC<CuteToastProps> = ({
    message,
    onClose,
    duration = 4000,
    icon = 'success'
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getGradient = () => {
        if (icon === 'chat') {
            return 'from-indigo-500 via-purple-500 to-pink-500';
        }
        return 'from-green-500 via-emerald-500 to-teal-500';
    };

    const getIcon = () => {
        if (icon === 'chat') {
            return <MessageCircle className="w-6 h-6" />;
        }
        return <CheckCircle className="w-6 h-6" />;
    };

    return (
        <div className="fixed top-24 right-6 z-[9999] animate-slide-in-bounce">
            <div className={`bg-gradient-to-r ${getGradient()} text-white rounded-2xl shadow-2xl p-5 pr-12 min-w-[340px] max-w-md relative overflow-hidden transform hover:scale-105 transition-transform duration-200`}>
                {/* Animated background sparkles */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <Sparkles className="absolute top-3 right-10 w-4 h-4 animate-sparkle-1" />
                    <Sparkles className="absolute bottom-4 right-20 w-3 h-3 animate-sparkle-2" />
                    <Sparkles className="absolute top-1/2 right-6 w-3 h-3 animate-sparkle-3" />
                    <Sparkles className="absolute top-2 left-8 w-4 h-4 animate-sparkle-4" />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/25 transition-all hover:rotate-90 duration-300"
                    aria-label="Đóng thông báo"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex items-start gap-3 relative z-10">
                    <div className="flex-shrink-0">
                        <div className="bg-white/25 rounded-full p-2.5 backdrop-blur-sm animate-bounce-subtle shadow-lg">
                            {getIcon()}
                        </div>
                    </div>
                    <div className="flex-1 pt-1">
                        <p className="font-bold text-base leading-relaxed drop-shadow-sm">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 rounded-b-2xl overflow-hidden">
                    <div
                        className="h-full bg-white/70 shadow-sm animate-progress"
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>

                {/* Decorative dots */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <style>{`
                @keyframes slide-in-bounce {
                    0% {
                        transform: translateX(400px) rotate(10deg);
                        opacity: 0;
                    }
                    60% {
                        transform: translateX(-10px) rotate(-2deg);
                        opacity: 1;
                    }
                    80% {
                        transform: translateX(5px) rotate(1deg);
                    }
                    100% {
                        transform: translateX(0) rotate(0);
                        opacity: 1;
                    }
                }

                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }

                @keyframes sparkle-1 {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.3) rotate(180deg);
                    }
                }

                @keyframes sparkle-2 {
                    0%, 100% {
                        opacity: 0.4;
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2) rotate(-180deg);
                    }
                }

                @keyframes sparkle-3 {
                    0%, 100% {
                        opacity: 0.2;
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 0.9;
                        transform: scale(1.4) rotate(180deg);
                    }
                }

                @keyframes sparkle-4 {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.1) rotate(-180deg);
                    }
                }

                @keyframes bounce-subtle {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-4px);
                    }
                }

                .animate-slide-in-bounce {
                    animation: slide-in-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .animate-progress {
                    animation: progress linear forwards;
                }

                .animate-sparkle-1 {
                    animation: sparkle-1 2s ease-in-out infinite;
                }

                .animate-sparkle-2 {
                    animation: sparkle-2 2.5s ease-in-out infinite 0.3s;
                }

                .animate-sparkle-3 {
                    animation: sparkle-3 2.2s ease-in-out infinite 0.6s;
                }

                .animate-sparkle-4 {
                    animation: sparkle-4 2.8s ease-in-out infinite 0.9s;
                }

                .animate-bounce-subtle {
                    animation: bounce-subtle 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
