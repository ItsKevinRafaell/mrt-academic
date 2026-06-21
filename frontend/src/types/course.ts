export interface Course {
  id: number;
  code: string;
  name: string;
  sks: number;
  description?: string;
  instructors?: string[];
  cawu_id?: number;
  course_type?: "lecturer" | "lab";
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CourseInput {
  code: string;
  name: string;
  sks: number;
  description?: string;
  instructors?: string[];
  cawu_id?: number;
  course_type?: "lecturer" | "lab";
}
