import { api, unwrapData } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session, SessionInput } from "@/types";

export type { Session } from "@/types";

// Query keys
export const sessionKeys = {
  byCourse: (courseId: number) => ["sessions", courseId] as const,
  detail: (id: number) => ["session", id] as const,
};

// API functions
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

// React Query hooks
export function useSessions(courseId: number) {
  return useQuery({
    queryKey: sessionKeys.byCourse(courseId),
    queryFn: () => getSessions(courseId),
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => getSession(id),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: number; input: SessionInput }) =>
      createSession(courseId, input),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.byCourse(courseId) });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: number; input: SessionInput }) =>
      updateSession(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
