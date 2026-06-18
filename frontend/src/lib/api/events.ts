import { api, unwrapData } from "./client";
import type { AcademicEvent, EventInput } from "@/types";

export async function getEvents(): Promise<AcademicEvent[]> {
  const res = await api.get("/events");
  return unwrapData<AcademicEvent[]>(res);
}

export async function getEvent(id: number): Promise<AcademicEvent> {
  const res = await api.get(`/events/${id}`);
  return unwrapData<AcademicEvent>(res);
}

export async function createEvent(input: EventInput): Promise<AcademicEvent> {
  const res = await api.post("/events", input);
  return unwrapData<AcademicEvent>(res);
}

export async function updateEvent(
  id: number,
  input: Partial<EventInput>
): Promise<AcademicEvent> {
  const res = await api.put(`/events/${id}`, input);
  return unwrapData<AcademicEvent>(res);
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`);
}
