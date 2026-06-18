import { api } from './client';

export interface CalendarEvent {
  id: number | string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  course_id?: number;
  topic_id?: number;
  session_id?: number;
  event_type: "class" | "exam" | "assignment" | "other";
  color?: string;
  location?: string;
  is_all_day?: boolean;
  course_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: string;
  is_all_day?: boolean;
  color?: string;
  location?: string;
  course_id?: number;
  session_id?: number;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  is_all_day?: boolean;
  color?: string;
  location?: string;
  course_id?: number;
  session_id?: number;
}

export const getCalendarEvents = async (
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await api.get(`/calendar?${params.toString()}`);
  return response?.data?.data || [];
};

export const getCalendarEventById = async (id: number): Promise<CalendarEvent> => {
  const response = await api.get(`/calendar/${id}`);
  return response?.data?.data;
};

export const createCalendarEvent = async (
  data: CreateCalendarEventRequest
): Promise<CalendarEvent> => {
  const response = await api.post('/calendar', data);
  return response?.data?.data;
};

export const updateCalendarEvent = async (
  id: number | string,
  data: UpdateCalendarEventRequest
): Promise<CalendarEvent> => {
  const response = await api.put(`/calendar/${id}`, data);
  return response?.data?.data;
};

export const deleteCalendarEvent = async (id: number | string): Promise<void> => {
  await api.delete(`/calendar/${id}`);
};

export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get('/schedules');
  return response?.data?.data || [];
};

export const getScheduleById = async (id: number): Promise<Schedule> => {
  const response = await api.get(`/schedules/${id}`);
  return response?.data?.data;
};

export const getActiveSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get('/schedules/active');
  return response?.data?.data || [];
};

export const getActiveSession = async (): Promise<Schedule | null> => {
  const schedules = await getActiveSchedules();
  if (schedules.length === 0) {
    return null;
  }

  // Find schedule that is currently active based on time
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const activeSchedule = schedules.find(schedule => {
    const isToday = schedule.day_of_week === currentDay;
    const isWithinTime = schedule.start_time <= currentTime && schedule.end_time >= currentTime;
    return isToday && isWithinTime;
  });

  return activeSchedule || schedules[0]; // Return first schedule if no exact match
};

export const createSchedule = async (data: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> => {
  const response = await api.post('/schedules', data);
  return response?.data?.data;
};

export const updateSchedule = async (
  id: number,
  data: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at'>>
): Promise<Schedule> => {
  const response = await api.put(`/schedules/${id}`, data);
  return response?.data?.data;
};

export const deleteSchedule = async (id: number): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};
