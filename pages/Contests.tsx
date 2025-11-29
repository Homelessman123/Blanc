import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Tag, Share2, Award, Users, CheckCircle, Loader2, X } from 'lucide-react';
import { Button, Input, Card, Badge, Tabs } from '../components/ui/Common';
import { useContests, useDebounce } from '../lib/hooks';
import { Contest } from '../types';

// Helper functions
const formatPrice = (price: number) => {
  if (price === 0) return 'Miễn phí';
  return price.toLocaleString('vi-VN') + 'đ';
};

const getRemainingDays = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Đã kết thúc';
  if (days === 0) return 'Hôm nay';
  return `Còn ${days} ngày`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const STATUS_MAP: Record<string, string> = {
  'OPEN': 'Đang mở đăng ký',
  'FULL': 'Sắp diễn ra',
  'CLOSED': 'Đã kết thúc',
};

const TAG_CATEGORIES = ['UI/UX', 'Design', 'Coding', 'Marketing', 'Data', 'AI', 'IoT', 'Animation'];

// --- CONTEST LIST COMPONENT ---
const ContestList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch contests
  const { contests, isLoading, error, refetch } = useContests({ limit: 50 });

  // Filter contests locally
  const filteredContests = contests.filter(contest => {
    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const matchesSearch =
        contest.title.toLowerCase().includes(query) ||
        contest.organizer.toLowerCase().includes(query) ||
        contest.description?.toLowerCase().includes(query) ||
        contest.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const hasTag = contest.tags?.some(tag =>
        selectedTags.some(selected => tag.toLowerCase().includes(selected.toLowerCase()))
      );
      if (!hasTag) return false;
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(contest.status)) {
      return false;
    }

    return true;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tất cả cuộc thi</h1>
          <p className="text-slate-500">
            {isLoading ? 'Đang tải...' : `${filteredContests.length} cuộc thi phù hợp`}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            className="px-3 lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Lĩnh vực</h3>
            <div className="space-y-2">
              {TAG_CATEGORIES.map(tag => (
                <label key={tag} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Trạng thái</h3>
            <div className="space-y-2">
              {Object.entries(STATUS_MAP).map(([status, label]) => (
                <label key={status} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* List */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-5">
                  <div className="flex justify-between mb-2">
                    <div className="h-5 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-full bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded mb-4" />
                  <div className="pt-4 border-t border-slate-100 flex gap-4">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                    <div className="h-4 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
              </Card>
            ))
          ) : error ? (
            <div className="md:col-span-2 text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={refetch}>Thử lại</Button>
            </div>
          ) : filteredContests.length > 0 ? (
            filteredContests.map((contest) => (
              <Card
                key={contest.id}
                className="flex flex-col h-full cursor-pointer hover:border-primary-200"
                onClick={() => navigate(`/contests/${contest.id}`)}
              >
                <div className="relative h-48 w-full bg-slate-200">
                  <img
                    src={contest.image || `https://picsum.photos/seed/${contest.id}/600/400`}
                    alt={contest.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3" status={contest.status}>{contest.status}</Badge>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {contest.tags?.[0] || 'General'}
                    </span>
                    <span className="text-xs text-slate-400">{getRemainingDays(contest.deadline)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{contest.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">
                    {contest.description || 'Tham gia để trải nghiệm và phát triển kỹ năng của bạn.'}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {formatDate(contest.dateStart)}</div>
                      <div className="flex items-center"><Users className="w-3 h-3 mr-1" /> {contest.organizer}</div>
                    </div>
                    <span className="font-medium text-slate-900">{formatPrice(contest.fee)}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">Không tìm thấy cuộc thi nào</p>
              <p className="text-sm text-slate-400 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- CONTEST DETAIL COMPONENT ---
const ContestDetail: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Tổng quan');

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Banner */}
      <div className="h-64 md:h-80 w-full relative bg-slate-900">
        <img src={`https://picsum.photos/seed/c${id}/1200/600`} alt="Banner" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <Badge className="mb-3 bg-white/20 text-white backdrop-blur-sm border-0">Design Challenge</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cuộc thi Thiết kế UI/UX Sáng tạo 2024</h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-200 text-sm">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> 20/10/2024 - 20/11/2024</span>
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> Online</span>
              <span className="flex items-center"><Users className="w-4 h-4 mr-2" /> Ban tổ chức: TechGen Z</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[500px]">
            <Tabs
              tabs={['Tổng quan', 'Giải thưởng', 'Thể lệ', 'Lịch trình']}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="prose prose-slate max-w-none">
              {activeTab === 'Tổng quan' && (
                <div>
                  <p className="lead text-lg text-slate-600 mb-4">Chào mừng bạn đến với cuộc thi thiết kế lớn nhất năm dành cho sinh viên.</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mục tiêu</h3>
                  <p className="text-slate-600 mb-4">Khơi dậy niềm đam mê sáng tạo và cung cấp sân chơi chuyên nghiệp cho các bạn trẻ.</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Đối tượng tham gia</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                    <li>Sinh viên các trường đại học, cao đẳng.</li>
                    <li>Yêu thích thiết kế giao diện và trải nghiệm người dùng.</li>
                    <li>Có thể tham gia cá nhân hoặc đội nhóm (tối đa 3 người).</li>
                  </ul>
                </div>
              )}
              {activeTab === 'Giải thưởng' && (
                <div className="grid gap-4">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-center">
                    <div className="bg-amber-100 p-3 rounded-full mr-4"><Award className="w-6 h-6 text-amber-600" /></div>
                    <div>
                      <div className="font-bold text-slate-900">Giải Nhất</div>
                      <div className="text-slate-600">10.000.000 VNĐ + Cúp lưu niệm</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center">
                    <div className="bg-slate-200 p-3 rounded-full mr-4"><Award className="w-6 h-6 text-slate-600" /></div>
                    <div>
                      <div className="font-bold text-slate-900">Giải Nhì</div>
                      <div className="text-slate-600">5.000.000 VNĐ</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500">Phí tham gia</span>
              <span className="text-2xl font-bold text-primary-600">Miễn phí</span>
            </div>
            <Button className="w-full mb-3" size="lg">Đăng ký ngay</Button>
            <Button variant="secondary" className="w-full flex items-center justify-center">
              <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
            </Button>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <h4 className="font-semibold text-slate-900 text-sm">Tags</h4>
              <div className="flex flex-wrap gap-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">#UI/UX</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">#Design</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">#Creative</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Đơn vị tổ chức</h4>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div>
                <div className="font-medium text-slate-900">TechGen Z Club</div>
                <div className="text-xs text-slate-500">Học viện Bưu chính Viễn thông</div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export { ContestList, ContestDetail };