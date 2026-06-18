import { api, unwrapData } from "./client";
import type { IPKData, GradeComponentWithScore, GradeComponent } from "@/types";

export async function getIPKData(cawu: number): Promise<IPKData[]> {
  const res = await api.get(`/grades?cawu=${cawu}`);
  return unwrapData<IPKData[]>(res);
}

export async function getGradeComponents(courseId: number): Promise<GradeComponent[]> {
  const res = await api.get(`/courses/${courseId}/grade-components`);
  return unwrapData<GradeComponent[]>(res);
}

export async function createGradeComponent(
  courseId: number,
  name: string,
  weight: number
): Promise<GradeComponent> {
  const res = await api.post(`/courses/${courseId}/grade-components`, { name, weight });
  return unwrapData<GradeComponent>(res);
}

export async function updateGradeComponent(
  componentId: number,
  name: string,
  weight: number
): Promise<GradeComponent> {
  const res = await api.put(`/grade-components/${componentId}`, { name, weight });
  return unwrapData<GradeComponent>(res);
}

export async function deleteGradeComponent(componentId: number): Promise<void> {
  await api.delete(`/grade-components/${componentId}`);
}

export async function submitGrades(
  courseId: number,
  grades: { component_id: number; score: number }[]
): Promise<void> {
  await api.post(`/courses/${courseId}/grades/bulk`, { grades });
}

export async function exportGrades(cawu: number): Promise<void> {
  const token = localStorage.getItem("mrt_token");
  const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1"}/export/grades?cawu=${cawu}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to export grades");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nilai-cawu-${cawu}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Calculate IP for a single cawu
export function calculateIP(entries: { sks: number; score?: number }[]): number {
  let totalSKS = 0;
  let totalWeighted = 0;

  entries.forEach((entry) => {
    if (entry.score !== undefined && entry.score !== null) {
      totalSKS += entry.sks;
      totalWeighted += entry.sks * (entry.score / 100) * 4; // Convert to 4.0 scale
    }
  });

  return totalSKS > 0 ? totalWeighted / totalSKS : 0;
}

// Calculate IPK (cumulative GPA) across all cawu
export function calculateIPK(allCawuData: { entries: { sks: number; score?: number }[] }[]): number {
  let totalSKS = 0;
  let totalWeighted = 0;

  allCawuData.forEach((cawuData) => {
    cawuData.entries.forEach((entry) => {
      if (entry.score !== undefined && entry.score !== null) {
        totalSKS += entry.sks;
        totalWeighted += entry.sks * (entry.score / 100) * 4; // Convert to 4.0 scale
      }
    });
  });

  return totalSKS > 0 ? totalWeighted / totalSKS : 0;
}

// Get total SKS for entries with grades
export function getTotalSKS(entries: { sks: number; score?: number }[]): number {
  return entries.reduce((sum, entry) => {
    return entry.score !== undefined && entry.score !== null ? sum + entry.sks : sum;
  }, 0);
}
