import { api, unwrapData } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Course, CourseInput } from "@/types";
import { toSlug } from "@/lib/utils/slug";

// Query keys
export const courseKeys = {
  all: ["courses"] as const,
  detail: (idOrSlug: number | string) => ["courses", idOrSlug] as const,
};

// API functions
export async function getCourses(): Promise<Course[]> {
  const res = await api.get("/courses");
  const courses = unwrapData<Course[]>(res);
  // Ensure all courses have slug
  return courses.map(c => ({
    ...c,
    slug: c.slug || toSlug(c.name)
  }));
}

// Get course by ID
export async function getCourse(id: number): Promise<Course> {
  const res = await api.get(`/courses/${id}`);
  const course = unwrapData<Course>(res);
  return { ...course, slug: course.slug || toSlug(course.name) };
}

// Get course by slug (fetches all then finds by slug)
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const courses = await getCourses();
  return courses.find(c => c.slug === slug) || null;
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const res = await api.post("/courses", input);
  return unwrapData<Course>(res);
}

export async function updateCourse(id: number, input: CourseInput): Promise<Course> {
  const res = await api.put(`/courses/${id}`, input);
  return unwrapData<Course>(res);
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`);
}

// React Query hooks
export function useCourses() {
  return useQuery({
    queryKey: courseKeys.all,
    queryFn: getCourses,
  });
}

// Hook to get course by slug - fetches all courses then finds by slug
export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: ["course", "slug", slug] as const,
    queryFn: () => getCourseBySlug(slug),
    enabled: !!slug,
  });
}

// Hook to get course by ID
export function useCourse(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => getCourse(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CourseInput }) =>
      updateCourse(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}
