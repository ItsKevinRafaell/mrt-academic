import { api, unwrapData } from "./client";
import type { PresentationConfig, PriorityStudent, PresentationRecord, LeaderboardEntry, Student, PresentationMode, PendingPresentation } from "@/types";

export async function getPresentationConfig(courseId: number): Promise<PresentationConfig> {
  const res = await api.get(`/courses/${courseId}/presentation/config`);
  return unwrapData<PresentationConfig>(res);
}

export async function setPresentationMode(
  courseId: number,
  mode: PresentationMode,
  priorityLimit: number,
  startNomorUrut: number
): Promise<PresentationConfig> {
  const res = await api.put(`/courses/${courseId}/presentation/config`, {
    mode,
    priority_limit: priorityLimit,
    start_nomor_urut: startNomorUrut,
  });
  return unwrapData<PresentationConfig>(res);
}

export async function getPriorityStudents(courseId: number): Promise<PriorityStudent[]> {
  const res = await api.get(`/courses/${courseId}/presentation/priority`);
  return unwrapData<PriorityStudent[]>(res);
}

export async function addPriorityStudent(courseId: number, userId: string): Promise<void> {
  await api.post(`/courses/${courseId}/presentation/priority/${userId}`, {});
}

export async function removePriorityStudent(courseId: number, userId: string): Promise<void> {
  await api.delete(`/courses/${courseId}/presentation/priority/${userId}`);
}

export async function reorderPriorityStudents(courseId: number, userIds: string[]): Promise<void> {
  await api.put(`/courses/${courseId}/presentation/priority/reorder`, { user_ids: userIds });
}

export async function getNextPresenter(courseId: number): Promise<PriorityStudent | null> {
  const res = await api.get(`/courses/${courseId}/presentation/next`);
  return unwrapData<PriorityStudent | null>(res);
}

// Request presentation (creates pending, needs approval)
export async function requestPresentation(
  courseId: number,
  userId: string,
  topic: string,
  points: number
): Promise<void> {
  await api.post(`/courses/${courseId}/presentation/request`, {
    user_id: userId,
    topic,
    points,
  });
}

// Record presentation directly (admin only, no approval needed)
export async function recordPresentation(
  courseId: number,
  userId: string,
  topic: string,
  points: number
): Promise<void> {
  await api.post(`/courses/${courseId}/presentation/record`, {
    user_id: userId,
    topic,
    points,
  });
}

export async function getLeaderboard(courseId: number): Promise<LeaderboardEntry[]> {
  const res = await api.get(`/courses/${courseId}/presentation/leaderboard`);
  return unwrapData<LeaderboardEntry[]>(res);
}

export async function getStudentHistory(
  courseId: number,
  userId: string
): Promise<PresentationRecord[]> {
  const res = await api.get(`/courses/${courseId}/presentation/history/${userId}`);
  return unwrapData<PresentationRecord[]>(res);
}

export async function getAllStudents(): Promise<Student[]> {
  const res = await api.get(`/presentation/students`);
  return unwrapData<Student[]>(res);
}

// Pending presentation workflow (kurikulum only)
export async function getPendingPresentations(courseId: number): Promise<PendingPresentation[]> {
  const res = await api.get(`/courses/${courseId}/presentation/pending`);
  return unwrapData<PendingPresentation[]>(res);
}

export async function approvePresentation(courseId: number, pendingId: number): Promise<void> {
  await api.post(`/courses/${courseId}/presentation/pending/${pendingId}/approve`, {});
}

export async function rejectPresentation(courseId: number, pendingId: number): Promise<void> {
  await api.post(`/courses/${courseId}/presentation/pending/${pendingId}/reject`, {});
}
