
import React, { useState, useEffect } from 'react';
import ContestCard from '../components/ContestCard';
import { Search } from 'lucide-react';
import type { Contest } from '../types';
import { contestAPI } from '../services/api';
import { mapContestList } from '../utils/contestUtils';

const ContestsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await contestAPI.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = mapContestList(data);
      const published = mapped.filter(
        (contest) => !contest.status || contest.status === 'PUBLISHED'
      );
      setContests(published);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = [...new Set(contests.flatMap(c => c.tags))];

  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contest.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? contest.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Đang tải danh sách cuộc thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400">Tìm Kiếm Thử Thách Tiếp Theo</h1>
        <p className="text-center text-gray-400">Khám phá danh sách các cuộc thi hấp dẫn được tuyển chọn kỹ lưỡng.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-20 z-40 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc tổ chức..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-shrink-0">
          <select
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            title="Lọc cuộc thi theo danh mục"
            aria-label="Lọc cuộc thi theo danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {filteredContests.length > 0 ? (
          filteredContests.map(contest => (
            <ContestCard key={contest.id} contest={contest} />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <p className="text-gray-400 text-lg">Không tìm thấy cuộc thi phù hợp.</p>
            <p className="text-gray-500 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
