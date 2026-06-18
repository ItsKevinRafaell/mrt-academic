import { api, unwrapData } from "./client";
import type { Photo } from "@/types/photo";

export async function getPhotosBySession(courseId: number, sessionId: number): Promise<Photo[]> {
  const response = await api.get(`/courses/${courseId}/sessions/${sessionId}/photos`);
  return unwrapData<Photo[]>(response);
}

export async function uploadPhoto(
  courseId: number,
  sessionId: number,
  file: File,
  title: string,
  caption?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (caption) {
    formData.append("caption", caption);
  }

  const response = await api.post(
    `/courses/${courseId}/sessions/${sessionId}/photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return unwrapData<Photo>(response);
}

export async function deletePhoto(photoId: number): Promise<void> {
  await api.delete(`/photos/${photoId}`);
}
