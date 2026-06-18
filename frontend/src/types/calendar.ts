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
  course_name?: string;
  is_all_day?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  course_id?: number;
  topic_id?: number;
  session_id?: number;
  event_type: "class" | "exam" | "assignment" | "other";
}
