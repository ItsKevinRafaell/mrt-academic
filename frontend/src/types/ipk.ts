export type Grade = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "E";

export interface GradeComponent {
  id: number;
  course_id: number;
  name: string;
  weight: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface GradeComponentWithScore extends GradeComponent {
  score?: number;
}

export interface IPKData {
  course_id: number;
  course_code: string;
  course_name: string;
  sks: number;
  grade?: string;
  score?: number;
  components: GradeComponentWithScore[];
}

export interface IPKEntry {
  course_id: number;
  course_name: string;
  sks: number;
  grade: Grade | null;
}

export interface IPKCawu {
  cawu: number;
  entries: IPKEntry[];
}

export interface IPKSummary {
  ipk: number;
  per_cawu: { cawu: number; ip: number; total_sks: number }[];
  trend: { cawu: number; ip: number }[];
}
