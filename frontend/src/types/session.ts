export interface Session {
  id: number;
  course_id: number;
  course_name?: string;
  number: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionInput {
  number: number;
  title: string;
  description?: string;
}
