import { api, unwrapData } from "./client";

export interface MonitoringStudent {
  user_id: string;
  full_name: string;
  nim: string;
  completed_at?: string;
}

export interface TaskMonitoring {
  task_id: number;
  task_title: string;
  total_students: number;
  completed_count: number;
  completion_rate: number;
  completed: MonitoringStudent[];
  pending: MonitoringStudent[];
}

export async function getTaskMonitoring(
  taskId: number
): Promise<TaskMonitoring> {
  const res = await api.get(`/tasks/${taskId}/monitoring`);
  return unwrapData<TaskMonitoring>(res);
}

export async function getCourseMonitoring(
  courseId: number
): Promise<TaskMonitoring[]> {
  const res = await api.get(`/courses/${courseId}/tasks/monitoring`);
  return unwrapData<TaskMonitoring[]>(res);
}

export async function getTaskDetail(taskId: number) {
  const response = await api.get(`/tasks/${taskId}/detail`);
  return response.data.data;
}
