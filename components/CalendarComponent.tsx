import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import { format, isSameDay, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, Clock, Trophy, BookOpen, Bell } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'contest-deadline' | 'contest-start' | 'personal' | 'reminder';
    description?: string;
    color?: string;
}

interface CalendarComponentProps {
    events?: CalendarEvent[];
    onDateSelect?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
    events = [],
    onDateSelect,
    onEventClick
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const dayEvents = events.filter(event =>
            isSameDay(event.date, selectedDate)
        );
        setSelectedEvents(dayEvents);
    }, [selectedDate, events]);

    const handleDateChange = (date: Date | Date[]) => {
        const selectedDate = Array.isArray(date) ? date[0] : date;
        setSelectedDate(selectedDate);
        onDateSelect?.(selectedDate);
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'contest-deadline':
            case 'contest-start':
                return <Trophy className="w-4 h-4" />;
            case 'personal':
                return <BookOpen className="w-4 h-4" />;
            case 'reminder':
                return <Bell className="w-4 h-4" />;
            default:
                return <CalendarDays className="w-4 h-4" />;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'contest-deadline':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'contest-start':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'personal':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'reminder':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        }
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const dayEvents = events.filter(event => isSameDay(event.date, date));
            if (dayEvents.length > 0) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                );
            }
        }
        return null;
    };

    const upcomingEvents = events
        .filter(event => event.date >= startOfDay(new Date()))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-xl p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <CalendarDays className="w-6 h-6" />
                    Lịch sự kiện
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'calendar'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white bg-opacity-10 text-gray-300 hover:bg-white bg-opacity-20'
                            }`}
                    >
                        Lịch
                    </button>
                    <button
                        onClick={() => setViewMode('agenda')}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'agenda'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white bg-opacity-10 text-gray-300 hover:bg-white bg-opacity-20'
                            }`}
                    >
                        Danh sách
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'calendar' ? (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="grid lg:grid-cols-3 gap-6"
                    >
                        {/* Calendar */}
                        <div className="lg:col-span-2">
                            <Calendar
                                onChange={handleDateChange}
                                value={selectedDate}
                                tileContent={tileContent}
                                locale="vi"
                                className="w-full"
                            />
                        </div>

                        {/* Selected Date Events */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">
                                {format(selectedDate, 'dd MMMM yyyy', { locale: vi })}
                            </h3>

                            {selectedEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedEvents.map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => onEventClick?.(event)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${getEventColor(event.type)}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getEventIcon(event.type)}
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                                    {event.description && (
                                                        <p className="text-xs opacity-80 mt-1">{event.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                                                        <Clock className="w-3 h-3" />
                                                        {format(event.date, 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Không có sự kiện nào</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="agenda"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-semibold text-gray-200">Sự kiện sắp tới</h3>

                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingEvents.map((event, index) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => onEventClick?.(event)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${getEventColor(event.type)}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{event.title}</h4>
                                                {event.description && (
                                                    <p className="text-sm opacity-80 mt-1">{event.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2 text-sm opacity-60">
                                                    <CalendarDays className="w-4 h-4" />
                                                    {format(event.date, 'dd/MM/yyyy', { locale: vi })}
                                                    <Clock className="w-4 h-4 ml-2" />
                                                    {format(event.date, 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Không có sự kiện nào sắp tới</p>
                                <p className="text-sm opacity-60 mt-1">Hãy thêm sự kiện mới để theo dõi lịch trình</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CalendarComponent;
