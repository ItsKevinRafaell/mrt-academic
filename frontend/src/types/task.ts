export interface Task {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  deadline: string;
  submission_link?: string; // TODO: API_NOT_READY — field belum ada di backend
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  deadline: string;
  submission_link?: string;
}

export interface TaskProgress {
  user_id: string;
  task_id: number;
  completed: boolean;
  completed_at?: string; // TODO: API_NOT_READY — field belum ada di backend
}

export interface TaskWithProgress extends Task {
  progress?: TaskProgress;
}
