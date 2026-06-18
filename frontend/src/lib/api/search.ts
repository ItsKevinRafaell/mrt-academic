// TODO: API_NOT_READY — no server search endpoint, using client-side search
// When backend implements GET /api/search?q=..., replace this file
import type { Course, Session, Task } from "@/types";
import { getCourses } from "./courses";
import { getSessions } from "./sessions";

export interface SearchResult {
  type: "course" | "session" | "task";
  id: number;
  title: string;
  subtitle: string;
  course_id: number;
  course_name: string;
  session_id?: number;
}

let searchIndex: SearchResult[] = [];
let indexed = false;

export async function buildSearchIndex(): Promise<void> {
  const results: SearchResult[] = [];

  try {
    const courses = await getCourses();
    for (const course of courses) {
      results.push({
        type: "course",
        id: course.id,
        title: course.name,
        subtitle: `${course.code} • ${course.sks} SKS`,
        course_id: course.id,
        course_name: course.name,
      });

      try {
        const sessions = await getSessions(course.id);
        for (const session of sessions) {
          results.push({
            type: "session",
            id: session.id,
            title: `Sesi ${session.number}: ${session.title}`,
            subtitle: course.name,
            course_id: course.id,
            course_name: course.name,
            session_id: session.id,
          });
        }
      } catch {
        // Skip sessions if fetch fails
      }
    }
  } catch {
    // Skip courses if fetch fails
  }

  searchIndex = results;
  indexed = true;
}

export function searchLocal(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return searchIndex.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q)
  );
}

export function isSearchIndexed(): boolean {
  return indexed;
}
