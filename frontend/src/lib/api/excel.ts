import { api, unwrapData } from "./client";

export interface ImportPreviewData {
  courses: {
    code: string;
    name: string;
    sks: number;
    description: string;
    instructors: string[];
    exists: boolean;
  }[];
  sessions: {
    course_code: string;
    number: number;
    title: string;
    description: string;
  }[];
  materials: {
    course_code: string;
    session_number: number;
    title: string;
    description: string;
    type: string;
    url: string;
  }[];
}

export interface ImportResult {
  courses_created: number;
  sessions_created: number;
  materials_created: number;
}

export function exportCourses(): Promise<void> {
  return api
    .get("/export/courses", { responseType: "blob" })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mrt-courses.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
}

export function exportTemplate(): Promise<void> {
  return api
    .get("/export/template", { responseType: "blob" })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mrt-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
}

export async function previewImport(
  file: File
): Promise<ImportPreviewData> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/import/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapData<ImportPreviewData>(res);
}

export async function importCourses(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/import/courses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapData<ImportResult>(res);
}
