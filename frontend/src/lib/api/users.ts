import { api, unwrapData } from "./client";
import type { User, Role } from "@/types";

export interface UserWithRole extends User {
  role: Role;
}

export async function getUsers(): Promise<UserWithRole[]> {
  const res = await api.get("/users");
  return unwrapData<UserWithRole[]>(res);
}

export async function getUser(id: string): Promise<UserWithRole> {
  const res = await api.get(`/users/${id}`);
  return unwrapData<UserWithRole>(res);
}

export async function updateUserRole(
  id: string,
  role: Role
): Promise<UserWithRole> {
  const res = await api.put(`/users/${id}/role`, { role });
  return unwrapData<UserWithRole>(res);
}

export async function getRoles(): Promise<{ id: string; name: string }[]> {
  const res = await api.get("/roles");
  return unwrapData<{ id: string; name: string }[]>(res);
}
