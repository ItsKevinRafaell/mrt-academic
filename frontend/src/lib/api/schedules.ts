import { api, unwrapData } from './client'
import type { Schedule, ScheduleInput } from '@/types'

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
