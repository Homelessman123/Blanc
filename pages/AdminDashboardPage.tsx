
import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Check, X } from 'lucide-react';
import { CONTESTS, COURSES } from '../constants';

// Mock data for submissions
const contestSubmissions = CONTESTS.slice(0, 2).map(c => ({...c, status: 'pending'}));
const courseSubmissions = COURSES.slice(0, 3).map(c => ({...c, status: 'pending'}));


const AdminDashboardPage: React.FC = () => {

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gray-800">
                    <h3 className="text-gray-400">Total Users</h3>
                    <p className="text-4xl font-bold text-sky-400">1,234</p>
                </Card>
                 <Card className="p-6 bg-gray-800">
                    <h3 className="text-gray-400">Pending Approvals</h3>
                    <p className="text-4xl font-bold text-orange-400">{contestSubmissions.length + courseSubmissions.length}</p>
                </Card>
                 <Card className="p-6 bg-gray-800">
                    <h3 className="text-gray-400">Total Contests</h3>
                    <p className="text-4xl font-bold text-green-400">{CONTESTS.length}</p>
                </Card>
                 <Card className="p-6 bg-gray-800">
                    <h3 className="text-gray-400">Total Revenue</h3>
                    <p className="text-4xl font-bold text-teal-400">$15,789.00</p>
                </Card>
            </div>
            
            {/* Contest Submissions */}
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Contest Submissions for Approval</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Organization</th>
                                <th className="p-3">Deadline</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contestSubmissions.map(contest => (
                                <tr key={contest.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-3">{contest.title}</td>
                                    <td className="p-3 text-gray-400">{contest.organization}</td>
                                    <td className="p-3 text-gray-400">{new Date(contest.deadline).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button className="!p-2 !rounded-md" title="Approve"><Check size={16} /></Button>
                                            <Button variant="danger" className="!p-2 !rounded-md" title="Reject"><X size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Course Submissions */}
            <Card className="p-6">
                 <h2 className="text-2xl font-bold mb-4">Course Submissions for Approval</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Author</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseSubmissions.map(course => (
                                <tr key={course.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-3">{course.title}</td>
                                    <td className="p-3 text-gray-400">{course.author}</td>
                                    <td className="p-3 text-gray-400">${course.price.toFixed(2)}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button className="!p-2 !rounded-md" title="Approve"><Check size={16} /></Button>
                                            <Button variant="danger" className="!p-2 !rounded-md" title="Reject"><X size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboardPage;
