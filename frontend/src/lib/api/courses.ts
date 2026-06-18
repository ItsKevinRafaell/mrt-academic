import { api, unwrapData } from "./client";
import type { Course, CourseInput } from "@/types";

export async function getCourses(): Promise<Course[]> {
  const res = await api.get("/courses");
  return unwrapData<Course[]>(res);
}

export async function getCourse(id: number): Promise<Course> {
  const res = await api.get(`/courses/${id}`);
  return unwrapData<Course>(res);
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const res = await api.post("/courses", input);
  return unwrapData<Course>(res);
}

export async function updateCourse(
  id: number,
  input: CourseInput
): Promise<Course> {
  const res = await api.put(`/courses/${id}`, input);
  return unwrapData<Course>(res);
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`);
}
