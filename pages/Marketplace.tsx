import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Star, BookOpen, Clock, PlayCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button, Card, Badge, Tabs } from '../components/ui/Common';
import { useCourses, useDebounce } from '../lib/hooks';
import { Course } from '../types';

// Helper functions
const formatPrice = (price: number) => {
  if (price === 0) return 'Miễn phí';
  return price.toLocaleString('vi-VN') + 'đ';
};

const CATEGORIES = [
  { label: 'Tất cả', value: '' },
  { label: 'Lập trình', value: 'programming' },
  { label: 'Thiết kế', value: 'design' },
  { label: 'Data & AI', value: 'data' },
  { label: 'Marketing', value: 'marketing' },
];

const LEVEL_MAP: Record<string, string> = {
  'Beginner': 'Cơ bản',
  'Intermediate': 'Trung cấp',
  'Advanced': 'Nâng cao',
};

// --- MARKETPLACE LIST ---
const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('');
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch courses from database
  const { courses, isLoading, error, refetch } = useCourses({ limit: 50 });

  // Filter courses locally
  const filteredCourses = courses.filter(course => {
    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Level filter
    if (activeLevel && course.level !== activeLevel) {
      return false;
    }

    // Category filter (based on title keywords for now)
    if (activeCategory) {
      const titleLower = course.title.toLowerCase();
      switch (activeCategory) {
        case 'programming':
          if (!titleLower.match(/react|node|web|fullstack|python|java|code/i)) return false;
          break;
        case 'design':
          if (!titleLower.match(/ui|ux|design|figma|creative/i)) return false;
          break;
        case 'data':
          if (!titleLower.match(/data|ai|ml|machine|analysis|generative/i)) return false;
          break;
        case 'marketing':
          if (!titleLower.match(/marketing|seo|content|social/i)) return false;
          break;
      }
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Thư viện khóa học</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Trau dồi kiến thức chuyên môn từ các chuyên gia hàng đầu. Lộ trình học tập được cá nhân hóa cho bạn.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm khóa học, giảng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-10 rounded-full border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Level filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <span className="text-sm text-slate-500 py-1">Trình độ:</span>
        <button
          onClick={() => setActiveLevel('')}
          className={`px-3 py-1 rounded text-sm transition-all ${!activeLevel ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
          Tất cả
        </button>
        {Object.entries(LEVEL_MAP).map(([level, label]) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-3 py-1 rounded text-sm transition-all ${activeLevel === level ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500">
          {isLoading ? 'Đang tải...' : `${filteredCourses.length} khóa học`}
        </p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton
          [...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4">
                <div className="h-5 w-full bg-slate-200 rounded mb-2" />
                <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
                <div className="h-4 w-20 bg-slate-100 rounded mb-3" />
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <div className="h-5 w-20 bg-slate-200 rounded" />
                  <div className="h-5 w-16 bg-slate-100 rounded" />
                </div>
              </div>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={refetch}>Thử lại</Button>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group cursor-pointer hover:-translate-y-1 transition-transform"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-200 relative">
                <img
                  src={course.image || `https://picsum.photos/seed/${course.id}/400/300`}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 line-clamp-2 pr-2">{course.title}</h3>
                </div>
                <div className="text-xs text-slate-500 mb-3">{course.instructor}</div>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-yellow-500 font-bold text-sm">{course.rating?.toFixed(1) || '0.0'}</span>
                  <div className="flex text-yellow-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(course.rating || 0) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-400 text-xs">({course.reviewsCount || 0})</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">{formatPrice(course.price)}</span>
                  <Badge className="bg-primary-50 text-primary-700 border-0">
                    {LEVEL_MAP[course.level] || course.level}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-2">Không tìm thấy khóa học nào</p>
            <p className="text-sm text-slate-400 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button variant="secondary" onClick={() => {
              setActiveCategory('');
              setActiveLevel('');
              setSearchQuery('');
            }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COURSE DETAIL ---
const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = React.useState('Nội dung');

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-slate-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="text-primary-400 font-semibold mb-2 text-sm tracking-wide uppercase">Web Development</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Trở thành Fullstack Developer chuyên nghiệp trong 6 tháng</h1>
            <p className="text-slate-300 text-lg mb-6 max-w-2xl">
              Học mọi thứ từ HTML, CSS, JS đến React, Node.js và triển khai ứng dụng thực tế.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <span className="flex items-center"><Star className="w-4 h-4 text-yellow-400 fill-current mr-1" /> 4.8 (520 đánh giá)</span>
              <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> 42 bài học</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 48 giờ video</span>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                <img src="https://picsum.photos/seed/instructor/100/100" alt="Instructor" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-medium text-white">Giảng viên: Trần Minh Hiếu</div>
                <div className="text-xs text-slate-400">Senior Software Engineer @ Google</div>
              </div>
            </div>
          </div>
          {/* Right side floating card placeholder for desktop layout logic (moved to main content area for mobile responsive flow usually, but keeping simple here) */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <Tabs tabs={['Nội dung', 'Lợi ích', 'Đánh giá']} activeTab={activeTab} onChange={setActiveTab} />
            <div className="prose prose-slate max-w-none">
              {activeTab === 'Nội dung' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Giáo trình chi tiết</h3>
                  {[1, 2, 3, 4].map((section) => (
                    <div key={section} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 font-medium text-slate-700 flex justify-between cursor-pointer">
                        <span>Phần {section}: Kiến thức nền tảng</span>
                        <span className="text-xs text-slate-500 mt-1">5 bài học • 45 phút</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'Lợi ích' && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> <span>Nắm vững React 18+</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> <span>Xây dựng Portfolio xịn</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> <span>Chứng chỉ hoàn thành</span></li>
                  <li className="flex items-start"><CheckCircle className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> <span>Hỗ trợ 24/7</span></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <Card className="p-6 sticky top-24 shadow-lg border-primary-100">
            <div className="text-3xl font-bold text-slate-900 mb-2">1.299.000đ</div>
            <div className="text-sm text-slate-500 line-through mb-6">2.500.000đ</div>
            <Button className="w-full mb-3 shadow-md shadow-primary-200" size="lg">Mua khóa học</Button>
            <Button variant="secondary" className="w-full">Thêm vào giỏ hàng</Button>
            <div className="mt-4 text-center text-xs text-slate-500">Hoàn tiền trong 30 ngày nếu không hài lòng</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { Marketplace, CourseDetail };