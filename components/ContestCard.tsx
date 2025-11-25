
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Contest } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { Calendar, Tag, DollarSign, MapPin, GraduationCap, Wifi, WifiOff, Globe } from 'lucide-react';

interface ContestCardProps {
  contest: Contest;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest }) => {
  const deadline = new Date(contest.deadline);

  const getFormatIcon = () => {
    switch (contest.format) {
      case 'ONLINE':
        return <Wifi size={14} />;
      case 'OFFLINE':
        return <MapPin size={14} />;
      case 'HYBRID':
        return <Globe size={14} />;
      default:
        return <Wifi size={14} />;
    }
  };

  const getFormatLabel = () => {
    switch (contest.format) {
      case 'ONLINE':
        return 'Trực tuyến';
      case 'OFFLINE':
        return 'Trực tiếp';
      case 'HYBRID':
        return 'Kết hợp';
      default:
        return 'Trực tuyến';
    }
  };

  return (
    <Link to={`/contests/${contest.id}`} className="block group h-full">
      <Card className="h-full flex flex-col hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-300">
        <div className="relative overflow-hidden h-48 flex-shrink-0">
          <img
            src={contest.imageUrl}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Organization Badge */}
          <div className="absolute top-3 right-3 bg-gray-900/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border border-gray-700/50 shadow-lg">
            {contest.organization}
          </div>

          {/* Fee Badge */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <DollarSign size={14} />
            {contest.fee === 0 ? 'Miễn phí' : `$${contest.fee}`}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors duration-300 mb-3 line-clamp-2 min-h-[56px]">
            {contest.title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-3 min-h-[60px]">
            {contest.description}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Deadline */}
            <div className="flex items-center text-red-400 bg-red-400/10 px-2.5 py-2 rounded-lg">
              <Calendar size={14} className="mr-1.5 flex-shrink-0" />
              <span className="font-medium text-xs truncate">{deadline.toLocaleDateString('vi-VN')}</span>
            </div>

            {/* Format */}
            {contest.format && (
              <div className="flex items-center text-sky-400 bg-sky-400/10 px-2.5 py-2 rounded-lg">
                {getFormatIcon()}
                <span className="ml-1.5 font-medium text-xs truncate">{getFormatLabel()}</span>
              </div>
            )}

            {/* Target Grade - Full width if exists */}
            {contest.targetGrade && (
              <div className="col-span-2 flex items-center text-purple-400 bg-purple-400/10 px-2.5 py-2 rounded-lg">
                <GraduationCap size={14} className="mr-1.5 flex-shrink-0" />
                <span className="font-medium text-xs truncate">{contest.targetGrade}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px]">
            {contest.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-gray-700/50 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 hover:bg-gray-600/50 transition-colors"
              >
                <Tag size={10} /> {tag}
              </span>
            ))}
            {contest.tags.length > 3 && (
              <span className="text-gray-500 text-xs font-medium px-2 py-1">
                +{contest.tags.length - 3}
              </span>
            )}
          </div>

        </div>
      </Card>
    </Link>
  );
};

export default ContestCard;
