import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Trophy, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from './ui/Common';
import { ScheduleEvent } from '../types';
import { useUserSchedule } from '../lib/hooks';

// Vietnamese day names
const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: ScheduleEvent[];
}

interface ScheduleCalendarProps {
    onEventClick?: (event: ScheduleEvent) => void;
    className?: string;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ onEventClick, className = '' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Calculate date range for fetching (current month ± 1 week buffer)
    const dateRange = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), -7);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 7);
        return { start, end };
    }, [currentDate]);

    const { schedule, isLoading, error, refetch } = useUserSchedule({
        startDate: dateRange.start,
        endDate: dateRange.end,
    });

    // Generate calendar days
    const calendarDays = useMemo((): CalendarDay[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDay = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: CalendarDay[] = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthDays - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                events: getEventsForDate(date, schedule),
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                events: getEventsForDate(date, schedule),
            });
        }

        // Next month days (fill to 42 cells = 6 weeks)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                events: getEventsForDate(date, schedule),
            });
        }

        return days;
    }, [currentDate, schedule]);

    // Get events for specific date
    function getEventsForDate(date: Date, events: ScheduleEvent[]): ScheduleEvent[] {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => {
            const startDate = event.dateStart.split('T')[0];
            const endDate = event.deadline.split('T')[0];
            return dateStr >= startDate && dateStr <= endDate;
        });
    }

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    }, []);

    // Get selected date events
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(selectedDate, schedule);
    }, [selectedDate, schedule]);

    // Format date for display
    const formatEventDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-emerald-500';
            case 'FULL': return 'bg-amber-500';
            case 'CLOSED': return 'bg-slate-400';
            default: return 'bg-primary-500';
        }
    };

    if (error) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => refetch()}>Thử lại</Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-slate-900">Lịch thi đấu</h3>
                    </div>
                    <Button size="sm" variant="secondary" onClick={goToToday}>
                        Hôm nay
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Tháng trước"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-lg font-semibold text-slate-900">
                        {MONTHS_VI[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h4>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Tháng sau"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : (
                    <>
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {DAYS_VI.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                const isSelected = selectedDate &&
                                    day.date.toDateString() === selectedDate.toDateString();
                                const hasEvents = day.events.length > 0;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`
                      relative p-2 min-h-[48px] rounded-lg text-sm transition-all
                      ${day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                      ${day.isToday ? 'bg-primary-100 font-bold' : ''}
                      ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:bg-slate-50'}
                    `}
                                    >
                                        <span className={day.isToday ? 'text-primary-600' : ''}>
                                            {day.date.getDate()}
                                        </span>

                                        {/* Event indicators */}
                                        {hasEvents && (
                                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                                {day.events.slice(0, 3).map((event, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event.status)}`}
                                                        title={event.title}
                                                    />
                                                ))}
                                                {day.events.length > 3 && (
                                                    <span className="text-[8px] text-slate-500">+{day.events.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary-600" />
                        Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')}
                    </h4>

                    {selectedDateEvents.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Không có sự kiện nào trong ngày này
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedDateEvents.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className="p-3 bg-white rounded-lg border border-slate-100 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-slate-900 text-sm truncate">
                                                {event.title}
                                            </h5>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatEventDate(event.dateStart)} - {formatEventDate(event.deadline)}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {event.organizer}
                                            </p>
                                        </div>
                                        <Badge
                                            status={event.status as 'OPEN' | 'FULL' | 'CLOSED'}
                                            className="text-xs flex-shrink-0"
                                        >
                                            {event.status}
                                        </Badge>
                                    </div>
                                    {event.tags.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {event.tags.slice(0, 2).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Đang mở
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Sắp diễn ra
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400" /> Đã kết thúc
                </span>
            </div>
        </Card>
    );
};

export default ScheduleCalendar;
