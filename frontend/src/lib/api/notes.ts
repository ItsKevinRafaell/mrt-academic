import type { Note } from "@/types/note";

export type { Note } from "@/types/note";

// Notes are stored locally first (offline-first), synced to API when online
const STORAGE_KEY = "mrt_notes";

function getNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getNotesBySession(sessionId: number): Note[] {
  return getNotes().filter((n) => n.session_id === sessionId);
}

export function getNotesByCourse(courseId: number): Note[] {
  return getNotes().filter((n) => n.course_id === courseId);
}

export function getAllNotes(): Note[] {
  return getNotes();
}

export function createNote(note: Omit<Note, "id" | "created_at" | "updated_at">): Note {
  const notes = getNotes();
  const newNote: Note = {
    ...note,
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
}

export function updateNote(id: string, updates: Partial<Note>): Note | null {
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notes[idx] = { ...notes[idx], ...updates, updated_at: new Date().toISOString() };
  saveNotes(notes);
  return notes[idx];
}

export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  saveNotes(filtered);
  return true;
}

// Export all notes for backup
export function exportNotes(): string {
  return JSON.stringify(getNotes(), null, 2);
}

// Import notes from backup
export function importNotes(json: string): Note[] {
  const imported = JSON.parse(json) as Note[];
  const existing = getNotes();
  const existingIds = new Set(existing.map((n) => n.id));
  const newOnes = imported.filter((n) => !existingIds.has(n.id));
  const merged = [...existing, ...newOnes];
  saveNotes(merged);
  return newOnes;
}
