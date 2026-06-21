export type ExamType = "kuis" | "uts" | "uas" | "tryout";
export type QuestionType = "multiple_choice" | "essay";

export interface ExamArchive {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  exam_type: ExamType;
  year: number;
  file_url: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface Simulation {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  questions?: SimulationQuestion[];
  created_at: string;
  updated_at: string;
}

export interface SimulationQuestion {
  id: number;
  simulation_id: number;
  question_text: string;
  question_type: QuestionType;
  options?: string; // JSON string for multiple choice
  correct_answer?: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExamArchiveRequest {
  course_id: number;
  title: string;
  description?: string;
  exam_type: ExamType;
  year: number;
  file_url: string;
  file_type?: string;
}

export interface CreateSimulationRequest {
  course_id: number;
  title: string;
  description?: string;
  duration_minutes: number;
}
