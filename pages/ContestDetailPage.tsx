
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CONTESTS, COURSES } from '../constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar, Tag, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

const ContestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contest = CONTESTS.find(c => c.id === id);
  const [isJoined, setIsJoined] = React.useState(false);

  if (!contest) {
    return (
        <div className="text-center py-20">
            <AlertTriangle className="mx-auto text-yellow-400" size={48} />
            <h1 className="mt-4 text-3xl font-bold">Contest Not Found</h1>
            <p className="text-gray-400">The contest you are looking for does not exist.</p>
        </div>
    );
  }

  const relatedCourses = COURSES.filter(course => contest.relatedCourseIds.includes(course.id));
  const deadline = new Date(contest.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const handleJoin = () => {
      // In a real app, this would make an API call.
      // Here, we just toggle the state.
      setIsJoined(!isJoined);
  };

  return (
    <div className="space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="p-0">
                    <img src={contest.imageUrl} alt={contest.title} className="w-full h-96 object-cover rounded-t-xl" />
                    <div className="p-8">
                        <h1 className="text-4xl font-extrabold text-white mb-2">{contest.title}</h1>
                        <p className="text-lg text-sky-400 font-semibold mb-6">{contest.organization}</p>
                        <p className="text-gray-300 leading-relaxed">{contest.description}</p>
                    </div>
                </Card>
            </div>
            <div className="space-y-6">
                 <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Contest Details</h3>
                    <div className="space-y-3 text-gray-300">
                        <div className="flex items-start">
                            <Calendar size={20} className="mr-3 mt-1 text-red-400 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold text-white">Deadline:</span> {deadline.toLocaleDateString()}
                                <span className={`ml-2 font-bold ${daysLeft > 10 ? 'text-green-400' : 'text-orange-400'}`}>
                                    ({daysLeft} days left)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Tag size={20} className="mr-3 text-sky-400 flex-shrink-0"/>
                            <div>
                                <span className="font-semibold text-white">Tags:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {contest.tags.map(tag => (
                                        <span key={tag} className="bg-gray-700 text-sky-300 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button onClick={handleJoin} className="w-full" disabled={isJoined}>
                            {isJoined ? (
                                <>
                                    <CheckCircle size={20}/> Joined (Timeline Added)
                                </>
                            ) : (
                                <>
                                     <Calendar size={20}/> Join & Add to Calendar
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
        
        {relatedCourses.length > 0 && (
            <section>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><BookOpen /> Recommended Prep Materials</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {relatedCourses.map(course => (
                         <Link key={course.id} to="/marketplace" className="block group">
                            <Card className="h-full flex flex-col">
                                <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover"/>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors">{course.title}</h3>
                                    <p className="text-gray-400 text-sm mb-2">by {course.author}</p>
                                    <p className="text-sky-400 font-bold text-xl mt-auto">${course.price}</p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        )}
    </div>
  );
};

export default ContestDetailPage;
