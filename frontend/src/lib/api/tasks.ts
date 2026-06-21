import { api, unwrapData } from "./client";
import type { Task, TaskInput, TaskProgress, TaskWithProgress } from "@/types";

export type { TaskWithProgress } from "@/types";

export async function getTasks(courseId: number): Promise<Task[]> {
  const res = await api.get(`/courses/${courseId}/tasks`);
  return unwrapData<Task[]>(res);
}

export async function createTask(
  courseId: number,
  input: TaskInput
): Promise<Task> {
  const res = await api.post(`/courses/${courseId}/tasks`, input);
  return unwrapData<Task>(res);
}

export async function updateTask(
  taskId: number,
  input: TaskInput
): Promise<Task> {
  const res = await api.put(`/tasks/${taskId}`, input);
  return unwrapData<Task>(res);
}

export async function deleteTask(taskId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function updateTaskProgress(
  taskId: number,
  completed: boolean
): Promise<TaskProgress> {
  const res = await api.patch(`/tasks/${taskId}/progress`, { completed });
  return unwrapData<TaskProgress>(res);
}
