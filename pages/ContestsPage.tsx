
import React, { useState } from 'react';
import { CONTESTS } from '../constants';
import ContestCard from '../components/ContestCard';
import { Search } from 'lucide-react';

const ContestsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const allTags = [...new Set(CONTESTS.flatMap(c => c.tags))];
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredContests = CONTESTS.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contest.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? contest.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-center mb-2">Find Your Next Challenge</h1>
        <p className="text-center text-gray-400">Browse through our curated list of competitions.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-20 z-40 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="Search by name or organization..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div className="flex-shrink-0">
             <select 
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
             >
                <option value="">All Categories</option>
                {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
             </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredContests.length > 0 ? (
            filteredContests.map(contest => (
                <ContestCard key={contest.id} contest={contest} />
            ))
        ) : (
            <p className="text-center text-gray-400 col-span-full">No contests found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
