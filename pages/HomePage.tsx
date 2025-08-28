
import React from 'react';
import { Link } from 'react-router-dom';
import { CONTESTS, COURSES } from '../constants';
import ContestCard from '../components/ContestCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const featuredContests = CONTESTS.slice(0, 3);
  const featuredCourses = COURSES.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center bg-gray-900/50 py-20 px-4 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-sky-900/30 opacity-30 animate-pulse"></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-sky-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-blue-400">
            Unlock Your Potential
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300 mb-8">
            Discover and manage your next big challenge. ContestHub is your gateway to national and international competitions, workshops, and learning resources.
          </p>
          <div className="flex justify-center">
            <Link to="/contests">
              <Button className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-0">
                Explore Contests <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Contests */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Featured Contests</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredContests.map(contest => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </section>

      {/* Marketplace CTA */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Level Up Your Skills</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map(course => (
            <Card key={course.id} className="flex flex-col">
              <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-2">by {course.author}</p>
                <p className="text-sky-400 font-bold text-xl mt-auto">${course.price}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/marketplace">
            <Button variant="secondary">
              Visit Marketplace <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
