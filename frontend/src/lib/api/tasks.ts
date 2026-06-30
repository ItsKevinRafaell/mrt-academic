import { api, unwrapData } from "./client";
import type { Task, TaskInput, TaskProgress, TaskWithProgress, TaskPhoto } from "@/types";

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

export async function getTaskPhotos(taskId: number): Promise<TaskPhoto[]> {
  const res = await api.get(`/tasks/${taskId}/photos`);
  return unwrapData<TaskPhoto[]>(res);
}

export async function uploadTaskPhoto(
  taskId: number,
  file: File,
  caption?: string
): Promise<TaskPhoto> {
  const formData = new FormData();
  formData.append("file", file);
  if (caption) {
    formData.append("caption", caption);
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/photos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.data;
}

export async function deleteTaskPhoto(
  taskId: number,
  photoId: number
): Promise<void> {
  await api.delete(`/tasks/${taskId}/photos/${photoId}`);
}
