import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Trophy, User } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    type: 'CONTEST_DEADLINE' | 'CONTEST_START' | 'PERSONAL' | 'REMINDER';
    contestId?: string;
}

interface ContestCalendarProps {
    events: CalendarEvent[];
    onDateSelect?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const ContestCalendar: React.FC<ContestCalendarProps> = ({
    events,
    onDateSelect,
    onEventClick
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [view, setView] = useState<'calendar' | 'list'>('calendar');

    const getEventsForDate = (date: Date) => {
        return events.filter(event =>
            isSameDay(event.startDate, date) || isSameDay(event.endDate, date)
        );
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'CONTEST_DEADLINE':
                return 'bg-red-500';
            case 'CONTEST_START':
                return 'bg-green-500';
            case 'PERSONAL':
                return 'bg-blue-500';
            case 'REMINDER':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'CONTEST_DEADLINE':
            case 'CONTEST_START':
                return <Trophy className="w-4 h-4" />;
            case 'PERSONAL':
                return <User className="w-4 h-4" />;
            case 'REMINDER':
                return <Clock className="w-4 h-4" />;
            default:
                return <CalendarIcon className="w-4 h-4" />;
        }
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length > 0) {
                return (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {dayEvents.slice(0, 2).map((event, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                            />
                        ))}
                        {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-400">+{dayEvents.length - 2}</div>
                        )}
                    </div>
                );
            }
        }
        return null;
    };

    const handleDateChange = (date: Date | Date[]) => {
        const selectedDate = Array.isArray(date) ? date[0] : date;
        setSelectedDate(selectedDate);
        onDateSelect?.(selectedDate);
    };

    const selectedDateEvents = getEventsForDate(selectedDate);
    const upcomingEvents = events
        .filter(event => event.startDate >= new Date())
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, 5);

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Lịch sự kiện</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${view === 'calendar'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Lịch
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${view === 'list'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Danh sách
                    </button>
                </div>
            </div>

            {view === 'calendar' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            tileContent={tileContent}
                            locale="vi-VN"
                            className="react-calendar-dark w-full"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-3">
                                {format(selectedDate, 'dd MMMM yyyy', { locale: vi })}
                            </h3>
                            {selectedDateEvents.length === 0 ? (
                                <p className="text-gray-400 text-sm">Không có sự kiện nào</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDateEvents.map((event) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => onEventClick?.(event)}
                                            className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                                        >
                                            <div className="flex items-start space-x-2">
                                                <div className={`p-1 rounded ${getEventTypeColor(event.type)} text-white`}>
                                                    {getEventTypeIcon(event.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                                    {event.description && (
                                                        <p className="text-xs text-gray-300 mt-1">{event.description}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="font-semibold">Sự kiện sắp tới</h3>
                    {upcomingEvents.length === 0 ? (
                        <p className="text-gray-400">Không có sự kiện nào sắp tới</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingEvents.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => onEventClick?.(event)}
                                    className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors card-hover"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${getEventTypeColor(event.type)} text-white`}>
                                            {getEventTypeIcon(event.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium">{event.title}</h4>
                                            {event.description && (
                                                <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                                <span>{format(event.startDate, 'dd/MM/yyyy')}</span>
                                                <span>{format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .react-calendar-dark {
          background-color: #374151;
          border: none;
          border-radius: 0.5rem;
          color: #f3f4f6;
          width: 100%;
        }
        
        .react-calendar-dark .react-calendar__navigation button {
          background-color: transparent;
          color: #f3f4f6;
          font-weight: 600;
        }
        
        .react-calendar-dark .react-calendar__navigation button:hover {
          background-color: #4b5563;
        }
        
        .react-calendar-dark .react-calendar__tile {
          background-color: transparent;
          color: #f3f4f6;
          border: none;
          padding: 0.75rem 0.5rem;
        }
        
        .react-calendar-dark .react-calendar__tile:hover {
          background-color: #4b5563;
        }
        
        .react-calendar-dark .react-calendar__tile--active {
          background-color: #8b5cf6 !important;
          color: white;
        }
        
        .react-calendar-dark .react-calendar__tile--now {
          background-color: #6366f1;
          color: white;
        }
      `}</style>
        </div>
    );
};

export default ContestCalendar;
