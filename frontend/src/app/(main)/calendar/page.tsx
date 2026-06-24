'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getCalendarEvents,
  getSchedules,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
  type Schedule,
} from '@/lib/api/calendar';
import { getCourses } from '@/lib/api/courses';
import { getTopicsByCourse } from '@/lib/api/topics';
import type { Course } from '@/types/course';
import type { Topic } from '@/types/topic';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, isSameDay, parseISO, startOfYear, isBefore, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCawuStore } from '@/lib/stores/cawu-store';
import { canManageCalendar } from '@/lib/rbac';

type ViewMode = 'month' | 'week' | 'day';

const EVENT_COLORS = {
  class: 'bg-blue-500',
  exam: 'bg-red-500',
  meeting: 'bg-green-500',
  holiday: 'bg-yellow-500',
  other: 'bg-gray-500',
};

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const { role } = useAuthStore();
  const canManage = canManageCalendar(role);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'class',
    is_all_day: false,
    color: '',
    location: '',
    course_id: undefined as number | undefined,
    topic_id: undefined as number | undefined,
    session_id: undefined as number | undefined,
    is_recurring: false,
    recurrence_pattern: '',
    week_parity: '' as '' | 'odd' | 'even',
  });

  const { selectedCawu } = useCawuStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    getCourses(selectedCawu?.id).then(setCourses).catch(() => setCourses([]));
  }, [selectedCawu]);

  // Auto-open add event dialog if ?action=add is in URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add' && !loading) {
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        start_time: `${format(now, 'yyyy-MM-dd')}T09:00`,
        end_time: `${format(now, 'yyyy-MM-dd')}T10:00`,
        event_type: 'class',
        is_all_day: false,
        color: '',
        location: '',
        course_id: undefined,
        topic_id: undefined,
        session_id: undefined,
        is_recurring: false,
        recurrence_pattern: '',
        week_parity: '',
      });
      setIsEventDialogOpen(true);
    }
  }, [searchParams, loading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, schedulesData] = await Promise.all([
        getCalendarEvents(),
        getSchedules(),
      ]);
      setEvents(eventsData || []);
      setSchedules(schedulesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setEvents([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getWeekParityForDate = (date: Date): 'odd' | 'even' | null => {
    const startStr = selectedCawu?.start_date;
    if (!startStr) return null;
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return null;
    const diffDays = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    return weekNumber % 2 === 0 ? 'odd' : 'even';
  };

  const matchesWeekParity = (event: CalendarEvent, date: Date): boolean => {
    const parity = event.week_parity;
    if (!parity) return true;
    const dateParity = getWeekParityForDate(date);
    if (!dateParity) return true;
    return parity === dateParity;
  };

  const recurringEvents = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const viewStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: viewStart, end: monthEnd });

    const generated: CalendarEvent[] = [];

    events.forEach((event) => {
      if (!event.is_recurring) return;

      const eventStart = parseISO(event.start_time);
      const timeStr = format(eventStart, 'HH:mm');
      const endStr = format(parseISO(event.end_time), 'HH:mm');

      allDays.forEach((day) => {
        if (day.getDay() !== eventStart.getDay()) return;
        if (isBefore(day, new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()))) return;
        if (!matchesWeekParity(event, day)) return;

        generated.push({
          ...event,
          id: `${event.id}-r-${format(day, 'yyyy-MM-dd')}`,
          start_time: `${format(day, 'yyyy-MM-dd')}T${timeStr}`,
          end_time: `${format(day, 'yyyy-MM-dd')}T${endStr}`,
        });
      });
    });

    return generated;
  }, [events, currentDate, selectedCawu]);

  // Generate schedule events for current month
  const scheduleEvents = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const generated: CalendarEvent[] = [];

    days.forEach((day) => {
      const dayOfWeek = day.getDay();
      const matchingSchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);

      matchingSchedules.forEach((schedule) => {
        const startTime = `${format(day, 'yyyy-MM-dd')}T${schedule.start_time}`;
        const endTime = `${format(day, 'yyyy-MM-dd')}T${schedule.end_time}`;

        generated.push({
          id: `schedule-${schedule.id}-${format(day, 'yyyy-MM-dd')}`,
          title: `${schedule.course_code || 'Class'} - ${schedule.course_name || 'Session'}`,
          start_time: startTime,
          end_time: endTime,
          event_type: 'class',
          color: 'bg-blue-500',
          course_id: schedule.course_id,
          session_id: schedule.session_id,
          course_name: schedule.course_name,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
        });
      });
    });

    return generated;
  }, [schedules, currentDate]);

  const nonRecurringEvents = useMemo(() => events.filter((e) => !e.is_recurring), [events]);

  // Combine events and schedules
  const allEvents = useMemo(() => {
    return [...nonRecurringEvents, ...recurringEvents, ...scheduleEvents];
  }, [nonRecurringEvents, recurringEvents, scheduleEvents]);

  const handlePrevMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      start_time: `${format(date, 'yyyy-MM-dd')}T09:00`,
      end_time: `${format(date, 'yyyy-MM-dd')}T10:00`,
    });
    setIsEventDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const buildPayload = () => {
    const { week_parity, ...rest } = formData;
    return {
      ...rest,
      week_parity: week_parity === '' ? null : week_parity,
      recurrence_pattern: rest.is_recurring ? (rest.recurrence_pattern || 'weekly') : '',
    };
  };

  const handleCreateEvent = async () => {
    try {
      await createCalendarEvent(buildPayload());
      setIsEventDialogOpen(false);
      loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    try {
      await updateCalendarEvent(selectedEvent.id, buildPayload());
      setIsEventDialogOpen(false);
      setIsViewDialogOpen(false);
      loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteCalendarEvent(selectedEvent.id);
      setIsViewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      event_type: 'class',
      is_all_day: false,
      color: '',
      location: '',
      course_id: undefined,
      topic_id: undefined,
      session_id: undefined,
      is_recurring: false,
      recurrence_pattern: '',
      week_parity: '',
    });
    setSelectedEvent(null);
  };

  const getEventsForDate = (date: Date) => {
    return allEvents.filter((event) => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-px bg-border">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="bg-background p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const dateEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`bg-background min-h-[120px] p-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                !isCurrentMonth ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-1">
                {dateEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className={`text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 ${
                      event.color || EVENT_COLORS[event.event_type as keyof typeof EVENT_COLORS] || 'bg-gray-500'
                    }`}
                  >
                    {format(parseISO(event.start_time), 'HH:mm')} {event.title}
                  </div>
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dateEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-auto">
        <div className="grid grid-cols-8 gap-px bg-border min-w-[800px]">
          {/* Time column header */}
          <div className="bg-background p-2"></div>

          {/* Day headers */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`bg-background p-2 text-center ${isToday(day) ? 'bg-primary/10' : ''}`}
            >
              <div className="font-semibold text-sm">{format(day, 'EEE', { locale: id })}</div>
              <div className={`text-lg ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}

          {/* Time slots */}
          {hours.map((hour) => (
            <>
              <div key={`time-${hour}`} className="bg-background p-2 text-xs text-muted-foreground text-right">
                {String(hour).padStart(2, '0')}:00
              </div>

              {days.map((day) => {
                const dayEvents = getEventsForDate(day).filter((event) => {
                  const eventHour = parseISO(event.start_time).getHours();
                  return eventHour === hour;
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    onClick={() => {
                      const clickedDate = new Date(day);
                      clickedDate.setHours(hour, 0, 0, 0);
                      handleDateClick(clickedDate);
                    }}
                    className="bg-background min-h-[60px] p-1 cursor-pointer hover:bg-accent/50 transition-colors border-t border-border"
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`text-xs p-1 rounded mb-1 text-white cursor-pointer hover:opacity-80 ${
                          event.color || EVENT_COLORS[event.event_type as keyof typeof EVENT_COLORS] || 'bg-gray-500'
                        }`}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="text-[10px] opacity-80">
                          {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="overflow-auto">
        <div className="space-y-px bg-border">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              const eventHour = parseISO(event.start_time).getHours();
              return eventHour === hour;
            });

            return (
              <div
                key={hour}
                onClick={() => {
                  const clickedDate = new Date(currentDate);
                  clickedDate.setHours(hour, 0, 0, 0);
                  handleDateClick(clickedDate);
                }}
                className="bg-background min-h-[80px] p-2 cursor-pointer hover:bg-accent/50 transition-colors grid grid-cols-[80px_1fr] gap-4"
              >
                <div className="text-sm text-muted-foreground text-right">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="space-y-1">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`p-2 rounded text-white cursor-pointer hover:opacity-80 ${
                        event.color || EVENT_COLORS[event.event_type as keyof typeof EVENT_COLORS] || 'bg-gray-500'
                      }`}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs opacity-80">
                        {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Calendar
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: id })}
            {viewMode === 'week' && `Week of ${format(currentDate, 'MMM d, yyyy', { locale: id })}`}
            {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy', { locale: id })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
          {canManage && (
            <Button onClick={() => handleDateClick(new Date())}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar View */}
      <Card className="overflow-hidden">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </Card>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div>
              <Label htmlFor="course_id">Mata Kuliah</Label>
              <Select
                value={formData.course_id ? String(formData.course_id) : ''}
                onValueChange={(value) => {
                  const courseID = value ? Number(value) : undefined;
                  setFormData((prev) => ({
                    ...prev,
                    course_id: courseID,
                    topic_id: undefined,
                  }));
                  if (courseID) {
                    const selected = courses.find((c) => c.id === courseID);
                    getTopicsByCourse(courseID).then(setTopics).catch(() => setTopics([]));
                    setFormData((prev) =>
                      prev.title
                        ? prev
                        : { ...prev, title: selected ? `${selected.code} - ${selected.name}` : prev.title }
                    );
                  } else {
                    setTopics([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {topics.length > 0 && (
              <div>
                <Label htmlFor="topic_id">Topik</Label>
                <Select
                  value={formData.topic_id ? String(formData.topic_id) : ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      topic_id: value ? Number(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih topik (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_recurring" className="text-sm font-medium">Ulang setiap minggu</Label>
                <input
                  id="is_recurring"
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_recurring: e.target.checked,
                      recurrence_pattern: e.target.checked ? 'weekly' : '',
                      week_parity: e.target.checked ? prev.week_parity : '',
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>

              {formData.is_recurring && (
                <div>
                  <Label htmlFor="week_parity" className="text-xs text-muted-foreground">Frekuensi minggu</Label>
                  <Select
                    value={formData.week_parity || 'both'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        week_parity: value === 'both' ? '' : (value as 'odd' | 'even'),
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Setiap minggu</SelectItem>
                      <SelectItem value="odd">Minggu ganjil</SelectItem>
                      <SelectItem value="even">Minggu genap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={selectedEvent ? handleUpdateEvent : handleCreateEvent}>
              {selectedEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedEvent?.title}</span>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFormData({
                        title: selectedEvent?.title || '',
                        description: selectedEvent?.description || '',
                        start_time: selectedEvent?.start_time || '',
                        end_time: selectedEvent?.end_time || '',
                        event_type: selectedEvent?.event_type || 'class',
                        is_all_day: selectedEvent?.is_all_day || false,
                        color: selectedEvent?.color || '',
                        location: selectedEvent?.location || '',
                        course_id: selectedEvent?.course_id,
                        topic_id: (selectedEvent as any)?.topic_id,
                        session_id: selectedEvent?.session_id,
                        is_recurring: selectedEvent?.is_recurring || false,
                        recurrence_pattern: selectedEvent?.recurrence_pattern || '',
                        week_parity: selectedEvent?.week_parity || '',
                      });
                      setIsViewDialogOpen(false);
                      setIsEventDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDeleteEvent}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {format(parseISO(selectedEvent.start_time), 'MMM d, yyyy HH:mm', { locale: id })} -{' '}
                  {format(parseISO(selectedEvent.end_time), 'HH:mm', { locale: id })}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge
                  className={`${
                    selectedEvent.color || EVENT_COLORS[selectedEvent.event_type as keyof typeof EVENT_COLORS]
                  } text-white`}
                >
                  {selectedEvent.event_type}
                </Badge>
              </div>

              {selectedEvent.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.course_name && (
                <div>
                  <Label className="text-xs text-muted-foreground">Course</Label>
                  <p className="text-sm mt-1">{selectedEvent.course_name}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
