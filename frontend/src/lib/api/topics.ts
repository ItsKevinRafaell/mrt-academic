import { api, unwrapData } from "./client";
import type {
  Topic,
  TopicWithDetails,
  TopicWithSessions,
  CreateTopicRequest,
  UpdateTopicRequest,
  ReorderTopicsRequest,
} from "@/types/topic";

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
