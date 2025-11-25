
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Contest, Course } from '../types';
import ContestCard from '../components/ContestCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import { ArrowRight, Clock, Award, Globe, Eye } from 'lucide-react';
import { contestAPI, productAPI } from '../services/api';
import { mapProductListToCourses } from '../utils/productUtils';
import { mapContestList } from '../utils/contestUtils';

const FeaturedCourseCard: React.FC<{ course: Course }> = ({ course }) => {
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

const HomePage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [contestRes, productRes] = await Promise.all([
          contestAPI.getAll(),
          productAPI.getAll(),
        ]);

        const contestData = Array.isArray(contestRes.data) ? contestRes.data : [];
        const productData = Array.isArray(productRes.data) ? productRes.data : [];

        const mappedContests = mapContestList(contestData).filter(
          (contest) => !contest.status || contest.status === 'PUBLISHED'
        );
        setContests(mappedContests);
        setCourses(mapProductListToCourses(productData));
      } catch (error) {
        console.error('Failed to load home page data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const featuredContests = contests.slice(0, 3);
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center bg-gray-900/50 py-20 px-4 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-sky-900/30 opacity-30 animate-pulse"></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-sky-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="relative z-10 overflow-visible">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400 leading-tight">
            Khơi Nguồn Tiềm Năng Của Bạn
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-8 leading-relaxed">
            Khám phá và chiến thắng thử thách tiếp theo của bạn. ContestHub - Cổng kết nối đến các cuộc thi quốc gia và quốc tế, workshop chuyên sâu và nguồn học liệu chất lượng cao.
          </p>
          <div className="flex justify-center">
            <Link to="/contests">
              <Button className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-0">
                Khám phá cuộc thi <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Contests */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400">
          Cuộc Thi Nổi Bật
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {featuredContests.length > 0 ? (
            featuredContests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))
          ) : (
            <p className="text-center text-gray-400 col-span-full">
              {loading ? 'Đang tải dữ liệu cuộc thi...' : 'Chưa có cuộc thi nào.'}
            </p>
          )}
        </div>
        <div className="text-center mt-8">
          <Link to="/contests">
            <Button variant="secondary" className="inline-flex items-center gap-2">
              Xem tất cả cuộc thi <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Marketplace CTA */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-400">
          Nâng Cấp Kỹ Năng Của Bạn
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {featuredCourses.length > 0 ? (
            featuredCourses.map((course) => (
              <FeaturedCourseCard key={course.id} course={course} />
            ))
          ) : (
            <p className="text-center text-gray-400 col-span-full">
              {loading ? 'Đang tải tài liệu...' : 'Chưa có tài liệu nào.'}
            </p>
          )}
        </div>
        <div className="text-center mt-8">
          <Link to="/marketplace">
            <Button variant="secondary" className="inline-flex items-center gap-2">
              Xem tất cả khóa học <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
