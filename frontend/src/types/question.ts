// TODO: API_NOT_READY — seluruh Questions endpoint belum ada di backend
export type QuestionType = "regular" | "exam";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: number;
  course_id: number;
  session_id?: number;
  title: string;
  question_text: string;
  type: QuestionType;
  options: QuestionOption[];
  answer_key: string;
  difficulty_level: DifficultyLevel;
  time_limit_minutes?: number;
  external_url?: string;
  created_at: string;
}

export interface QuestionInput {
  course_id: number;
  session_id?: number;
  title: string;
  question_text: string;
  type: QuestionType;
  options: QuestionOption[];
  answer_key: string;
  difficulty_level: DifficultyLevel;
  time_limit_minutes?: number;
  external_url?: string;
}

export interface ExamSubmission {
  user_id: string;
  question_id: number;
  answers: { option_key: string; selected: boolean }[];
  score?: number;
  time_spent_seconds: number;
  submitted_at: string;
}
