import { api, unwrapData } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Topic,
  TopicWithDetails,
  TopicWithSessions,
  CreateTopicRequest,
  UpdateTopicRequest,
  ReorderTopicsRequest,
} from "@/types/topic";

// Query keys
export const topicKeys = {
  byCourse: (courseId: number) => ["topics", courseId] as const,
  withSessions: (courseId: number) => ["topics-with-sessions", courseId] as const,
  detail: (topicId: number) => ["topic", topicId] as const,
};

// API functions
export async function getTopicsByCourse(courseId: number): Promise<Topic[]> {
  const response = await api.get(`/courses/${courseId}/topics`);
  return unwrapData<Topic[]>(response);
}

export async function getTopicsWithSessions(courseId: number): Promise<TopicWithSessions[]> {
  const response = await api.get(`/courses/${courseId}/topics-with-sessions`);
  return unwrapData<TopicWithSessions[]>(response);
}

export async function getTopicDetails(topicId: number): Promise<TopicWithDetails> {
  const response = await api.get(`/topics/${topicId}`);
  return unwrapData<TopicWithDetails>(response);
}

export async function createTopic(
  courseId: number,
  data: CreateTopicRequest
): Promise<Topic> {
  const response = await api.post(`/courses/${courseId}/topics`, data);
  return unwrapData<Topic>(response);
}

export async function updateTopic(
  topicId: number,
  data: UpdateTopicRequest
): Promise<Topic> {
  const response = await api.put(`/topics/${topicId}`, data);
  return unwrapData<Topic>(response);
}

export async function deleteTopic(topicId: number): Promise<void> {
  await api.delete(`/topics/${topicId}`);
}

export async function reorderTopics(
  courseId: number,
  data: ReorderTopicsRequest
): Promise<void> {
  await api.put(`/courses/${courseId}/topics/reorder`, data);
}

export async function assignSessionToTopic(
  topicId: number,
  sessionId: number
): Promise<void> {
  await api.post(`/topics/${topicId}/sessions`, { session_id: sessionId });
}

export async function removeSessionFromTopic(
  topicId: number,
  sessionId: number
): Promise<void> {
  await api.delete(`/topics/${topicId}/sessions/${sessionId}`);
}

export async function assignMaterialToTopic(
  topicId: number,
  materialId: number
): Promise<void> {
  await api.post(`/topics/${topicId}/materials`, { material_id: materialId });
}

export async function removeMaterialFromTopic(
  topicId: number,
  materialId: number
): Promise<void> {
  await api.delete(`/topics/${topicId}/materials/${materialId}`);
}

// React Query hooks
export function useTopicsByCourse(courseId: number) {
  return useQuery({
    queryKey: topicKeys.byCourse(courseId),
    queryFn: () => getTopicsByCourse(courseId),
  });
}

export function useTopicsWithSessions(courseId: number) {
  return useQuery({
    queryKey: topicKeys.withSessions(courseId),
    queryFn: () => getTopicsWithSessions(courseId),
  });
}

export function useTopicDetails(topicId: number) {
  return useQuery({
    queryKey: topicKeys.detail(topicId),
    queryFn: () => getTopicDetails(topicId),
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: CreateTopicRequest }) =>
      createTopic(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.byCourse(courseId) });
      queryClient.invalidateQueries({ queryKey: topicKeys.withSessions(courseId) });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: number; data: UpdateTopicRequest }) =>
      updateTopic(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["topics-with-sessions"] });
    },
  });
}
