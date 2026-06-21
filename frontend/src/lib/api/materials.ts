import { api, unwrapData } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Material, MaterialInput, SessionWithMaterials } from "@/types";

export type { Material } from "@/types";

// Query keys
export const materialKeys = {
  bySession: (sessionId: number) => ["materials", "session", sessionId] as const,
  byCourse: (courseId: number) => ["materials", "course", courseId] as const,
};

// API functions
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

// React Query hooks
export function useMaterialsBySession(sessionId: number) {
  return useQuery({
    queryKey: materialKeys.bySession(sessionId),
    queryFn: () => getMaterialsBySession(sessionId),
  });
}

export function useMaterialsByCourse(courseId: number) {
  return useQuery({
    queryKey: materialKeys.byCourse(courseId),
    queryFn: () => getMaterialsByCourse(courseId),
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MaterialInput }) =>
      updateMaterial(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}
