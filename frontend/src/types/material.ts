import type { Session } from "./session";

export type MaterialType = "pdf" | "link" | "video" | "image" | "ppt" | "doc" | "youtube";

export interface Material {
  id: number;
  session_id?: number;
  topic_id?: number;
  title: string;
  description?: string;
  type: MaterialType;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialInput {
  session_id?: number;
  topic_id?: number;
  title: string;
  description?: string;
  type: MaterialType;
  url: string;
}

export interface SessionWithMaterials extends Session {
  Materials: Material[];
}
