import { api } from "./client";

export interface GradeComponent {
  id: number;
  course_id: number;
  name: string;
  weight: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface GradeEntry {
  id: number;
  user_id: string;
  component_id: number;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ComponentWithGrade extends GradeComponent {
  score: number | null;
}

export async function getGradeComponents(courseId: number): Promise<GradeComponent[]> {
  const res = await api.get(`/courses/${courseId}/grade-components`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

export async function createGradeComponent(
  courseId: number,
  name: string,
  weight: number,
  type: string
): Promise<GradeComponent> {
  const res = await api.post(`/courses/${courseId}/grade-components`, { name, weight, type });
  return res.data;
}

export async function updateGradeComponent(
  id: number,
  name: string,
  weight: number,
  type: string
): Promise<GradeComponent> {
  const res = await api.put(`/grade-components/${id}`, { name, weight, type });
  return res.data;
}

export async function deleteGradeComponent(id: number): Promise<void> {
  await api.delete(`/grade-components/${id}`);
}

export async function getGradesForCourse(courseId: number): Promise<ComponentWithGrade[]> {
  const res = await api.get(`/grades?course_id=${courseId}`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

export async function saveGrade(
  courseId: number,
  componentId: number,
  score: number | null
): Promise<void> {
  await api.put(`/grades/${courseId}`, {
    component_id: componentId,
    score,
  });
}
