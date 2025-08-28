import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    hover?: boolean;
    onClick?: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    className = '',
    delay = 0,
    direction = 'up',
    hover = true,
    onClick
}) => {
    const getInitialPosition = () => {
        switch (direction) {
            case 'up':
                return { y: 50, opacity: 0 };
            case 'down':
                return { y: -50, opacity: 0 };
            case 'left':
                return { x: 50, opacity: 0 };
            case 'right':
                return { x: -50, opacity: 0 };
            default:
                return { y: 50, opacity: 0 };
        }
    };

    const hoverEffects = hover ? {
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2 }
    } : {};

    return (
        <motion.div
            initial={getInitialPosition()}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay }}
            whileHover={hoverEffects}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`card ${hover ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedCard;
