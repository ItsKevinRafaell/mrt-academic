import { api, unwrapData } from './client'
import type { Schedule, ScheduleInput } from '@/types'

export interface CurrentSchedule {
  schedule_id: number
  course_id: number
  course_code: string
  course_name: string
  topic_id?: number
  topic_title: string
  session_id?: number
  session_number?: number
  start_time: string
  end_time: string
  time_left_minutes: number
}

export async function getSchedules(): Promise<Schedule[]> {
  const response = await api.get('/schedules')
  return unwrapData<Schedule[]>(response)
}

export async function getActiveSchedule(): Promise<Schedule[]> {
  const response = await api.get('/schedules/active')
  return unwrapData<Schedule[]>(response)
}

export async function getScheduleById(id: number): Promise<Schedule> {
  const response = await api.get(`/schedules/${id}`)
  return unwrapData<Schedule>(response)
}

export async function getSchedulesByCourse(courseId: number): Promise<Schedule[]> {
  const response = await api.get(`/courses/${courseId}/schedules`)
  return unwrapData<Schedule[]>(response)
}

export async function createSchedule(data: ScheduleInput): Promise<Schedule> {
  const response = await api.post('/schedules', data)
  return unwrapData<Schedule>(response)
}

export async function updateSchedule(id: number, data: ScheduleInput): Promise<Schedule> {
  const response = await api.put(`/schedules/${id}`, data)
  return unwrapData<Schedule>(response)
}

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/schedules/${id}`)
}

export async function getCurrentSchedule(): Promise<CurrentSchedule[]> {
  const response = await api.get('/schedules/current')
  return response.data.data || []
}
