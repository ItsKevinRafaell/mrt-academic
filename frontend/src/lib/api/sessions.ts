import { api, unwrapData } from "./client";
import type { Session, SessionInput } from "@/types";

export type { Session } from "@/types";

export async function getSession(id: number): Promise<Session> {
  const res = await api.get(`/sessions/${id}`);
  return unwrapData<Session>(res);
}

export async function getSessions(courseId: number): Promise<Session[]> {
  const res = await api.get(`/courses/${courseId}/sessions`);
  return unwrapData<Session[]>(res);
}

export async function createSession(
  courseId: number,
  input: SessionInput
): Promise<Session> {
  const res = await api.post(`/courses/${courseId}/sessions`, input);
  return unwrapData<Session>(res);
}

export async function updateSession(
  sessionId: number,
  input: SessionInput
): Promise<Session> {
  const res = await api.put(`/sessions/${sessionId}`, input);
  return unwrapData<Session>(res);
}

export async function deleteSession(sessionId: number): Promise<void> {
  await api.delete(`/sessions/${sessionId}`);
}
