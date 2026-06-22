export interface Note {
  id: string;
  title: string;
  content: string;
  course_id: number | null;
  session_id: number | null;
  created_at: string;
  updated_at: string;
  tags: string[];
}
