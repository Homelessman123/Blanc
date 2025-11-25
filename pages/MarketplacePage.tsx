
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import { Search, Clock, Award, Globe, Eye } from 'lucide-react';
import { productAPI } from '../services/api';
import { mapProductListToCourses } from '../utils/productUtils';

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const levelLabels = {
    BEGINNER: 'Cơ bản',
    INTERMEDIATE: 'Trung cấp',
    ADVANCED: 'Nâng cao',
    EXPERT: 'Chuyên gia'
  };
  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

  return (
    <Card className="flex flex-col h-full group">
      <div className="relative">
        <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded-md text-xs font-semibold">
          {course.type}
        </div>
        {course.level && (
          <div className="absolute top-2 right-2 bg-blue-600/80 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
            <Award size={12} />
            {levelLabels[course.level]}
          </div>
        )}

        {/* View Details Overlay */}
        <Link
          to={`/courses/${course.id}`}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Eye size={24} className="text-white" />
          </div>
        </Link>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/courses/${course.id}`}>
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 hover:text-sky-400 transition-colors cursor-pointer">{course.title}</h3>
        </Link>
        <p className="text-sm text-gray-400 mb-2">Giảng viên: {course.author}</p>

        {/* Rating */}
        {course.rating && (
          <div className="mb-3">
            <StarRating
              rating={course.rating}
              reviewCount={course.reviewCount}
              size="sm"
            />
          </div>
        )}

        <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">{course.description}</p>

        {/* Course Info */}
        <div className="space-y-2 mb-4">
          {course.duration && (
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={14} className="mr-2" />
              Thời lượng: {course.duration}
            </div>
          )}
          {course.language && (
            <div className="flex items-center text-xs text-gray-400">
              <Globe size={14} className="mr-2" />
              Ngôn ngữ: {course.language}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <div className="text-2xl font-bold text-sky-300">
            {formatCurrency(course.price)}
          </div>
        </div>
      </div>
    </Card>
  );
};


const MarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll();
        const products = Array.isArray(response.data) ? response.data : [];
        setCourses(mapProductListToCourses(products));
      } catch (error) {
        console.error('Failed to load marketplace data', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const allTypes = useMemo(
    () => [...new Set(courses.map((c) => c.type))],
    [courses]
  );

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType ? course.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Đang tải khoá học và tài liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-400">Chợ Khóa Học</h1>
        <p className="text-center text-gray-400">Khám phá các khóa học và tài liệu giúp bạn vượt trội trong các cuộc thi.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-20 z-40 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-shrink-0">
          <select
            title="Lọc theo loại khóa học"
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Tất cả loại</option>
            {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
