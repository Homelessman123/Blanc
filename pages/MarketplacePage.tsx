
import React, { useState } from 'react';
import { COURSES } from '../constants';
import type { Course } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useCart } from '../contexts/CartContext';
import { Search, ShoppingCart } from 'lucide-react';

const CourseCard: React.FC<{ course: Course; onAddToCart: (course: Course) => void; }> = ({ course, onAddToCart }) => {
    return (
        <Card className="flex flex-col">
            <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover"/>
            <div className="p-4 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-sky-400 mb-1">{course.type}</span>
                <h3 className="text-lg font-bold text-white mb-1">{course.title}</h3>
                <p className="text-sm text-gray-400 mb-4">by {course.author}</p>
                <p className="text-gray-400 text-sm mb-4 flex-grow">{course.description.substring(0, 90)}...</p>
                <div className="flex justify-between items-center mt-auto">
                    <p className="text-2xl font-bold text-sky-300">${course.price}</p>
                    <Button onClick={() => onAddToCart(course)}>
                        <ShoppingCart size={18}/> Add to Cart
                    </Button>
                </div>
            </div>
        </Card>
    );
};


const MarketplacePage: React.FC = () => {
    const { addToCart } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const allTypes = [...new Set(COURSES.map(c => c.type))];
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const filteredCourses = COURSES.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              course.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType ? course.type === selectedType : true;
        return matchesSearch && matchesType;
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-center mb-2">Marketplace</h1>
        <p className="text-center text-gray-400">Find courses and materials to sharpen your competitive edge.</p>
      </div>

       <div className="flex flex-col md:flex-row gap-4 sticky top-20 z-40 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div className="flex-shrink-0">
             <select 
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
             >
                <option value="">All Types</option>
                {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
             </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} course={course} onAddToCart={addToCart} />
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
