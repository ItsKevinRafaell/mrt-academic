export type PresentationMode = "nomor_urut" | "prioritas";

export interface PresentationConfig {
  id: number;
  course_id: number;
  mode: PresentationMode;
  priority_limit: number;
  start_nomor_urut: number;
  next_nomor_urut: number;
  created_at: string;
  updated_at: string;
}

export interface PriorityStudent {
  id: number;
  course_id: number;
  user_id: string;
  user_name?: string;
  nomor_urut?: number;
  priority_order: number;
  created_at: string;
}

export interface PresentationRecord {
  id: number;
  course_id: number;
  user_id: string;
  user_name?: string;
  nomor_urut?: number;
  presented_at: string;
  topic?: string;
  points: number;
  approved_by?: string;
  approved_at?: string;
}

export interface PendingPresentation {
  id: number;
  course_id: number;
  user_id: string;
  user_name?: string;
  nomor_urut?: number;
  requested_at: string;
  topic?: string;
  points: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  nomor_urut: number;
  total_points: number;
  total_shows: number;
}

export interface Student {
  user_id: string;
  user_name: string;
  nomor_urut: number;
}
