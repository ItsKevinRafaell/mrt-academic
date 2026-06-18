export interface Schedule {
  id: number
  course_id: number
  day_of_week: number
  start_time: string
  end_time: string
  session_id?: number | null
  course_code?: string
  course_name?: string
  created_at: string
  updated_at: string
}

export interface ScheduleInput {
  course_id: number
  day_of_week: number
  start_time: string
  end_time: string
  session_id?: number
}

export interface ScheduleWithCourse extends Schedule {
  course_code: string
  course_name: string
}
