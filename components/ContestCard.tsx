
import React from 'react';
import { Link } from 'react-router-dom';
import type { Contest } from '../types';
import Card from './common/Card';
import { Calendar, Tag } from 'lucide-react';

interface ContestCardProps {
  contest: Contest;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest }) => {
  const deadline = new Date(contest.deadline);
  
  return (
    <Link to={`/contests/${contest.id}`} className="block group">
      <Card className="h-full flex flex-col">
        <div className="relative">
          <img src={contest.imageUrl} alt={contest.title} className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity duration-300"/>
          <div className="absolute top-2 right-2 bg-gray-900/70 text-white px-2 py-1 rounded-md text-sm font-semibold">{contest.organization}</div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors duration-300 mb-2">{contest.title}</h3>
          <p className="text-gray-400 text-sm mb-4 flex-grow">{contest.description.substring(0, 100)}...</p>
          <div className="mt-auto space-y-3">
             <div className="flex items-center text-sm text-red-400">
                <Calendar size={16} className="mr-2"/>
                Deadline: {deadline.toLocaleDateString()}
             </div>
             <div className="flex flex-wrap gap-2">
                {contest.tags.map(tag => (
                    <span key={tag} className="bg-gray-700 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Tag size={12}/> {tag}
                    </span>
                ))}
             </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ContestCard;
