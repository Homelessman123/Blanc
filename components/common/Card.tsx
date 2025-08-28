
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-gray-800/60 backdrop-blur-md 
      border border-gray-700 rounded-xl 
      shadow-lg shadow-black/20 
      transition-all duration-300 ease-in-out
      hover:border-sky-500/50 hover:shadow-sky-500/10 hover:-translate-y-1
      overflow-hidden
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;
