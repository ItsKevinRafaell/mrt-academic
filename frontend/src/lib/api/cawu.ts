import { api } from "./client";

export interface Cawu {
  id: number;
  name: string;
  year: number;
  semester: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export async function getCawus(): Promise<Cawu[]> {
  const response = await api.get("/cawu");
  return response.data.data || [];
}

export async function getActiveCawu(): Promise<Cawu | null> {
  const response = await api.get("/cawu/active/current");
  return response.data.data || null;
}

export async function getCawu(id: number): Promise<Cawu> {
  const response = await api.get(`/cawu/${id}`);
  return response.data.data;
}

export async function setActiveCawu(id: number): Promise<void> {
  await api.put(`/cawu/${id}/active`);
}

export async function createCawu(cawu: Omit<Cawu, "id">): Promise<Cawu> {
  const response = await api.post("/cawu", cawu);
  return response.data.data;
}

export async function updateCawu(id: number, cawu: Partial<Cawu>): Promise<Cawu> {
  const response = await api.put(`/cawu/${id}`, cawu);
  return response.data.data;
}

export async function deleteCawu(id: number): Promise<void> {
  await api.delete(`/cawu/${id}`);
}
