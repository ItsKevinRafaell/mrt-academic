import { api, unwrapData } from "./client";
import type { Material, MaterialInput, SessionWithMaterials } from "@/types";

export type { Material } from "@/types";

export async function getMaterials(
  courseId: number
): Promise<SessionWithMaterials[]> {
  const res = await api.get(`/courses/${courseId}/materials`);
  return unwrapData<SessionWithMaterials[]>(res);
}

export async function getMaterialsBySession(sessionId: number): Promise<Material[]> {
  const res = await api.get(`/sessions/${sessionId}/materials`);
  return unwrapData<Material[]>(res);
}

export async function getMaterialsByCourse(courseId: number): Promise<Material[]> {
  const res = await api.get(`/courses/${courseId}/materials`);
  const data = unwrapData<SessionWithMaterials[]>(res);
  // Flatten materials from all sessions
  return data.flatMap((session) => session.Materials || []);
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  const res = await api.post("/materials", input);
  return unwrapData<Material>(res);
}

export async function updateMaterial(
  materialId: number,
  input: MaterialInput
): Promise<Material> {
  const res = await api.put(`/materials/${materialId}`, input);
  return unwrapData<Material>(res);
}

export async function deleteMaterial(materialId: number): Promise<void> {
  await api.delete(`/materials/${materialId}`);
}
