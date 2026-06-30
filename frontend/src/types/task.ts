export interface Task {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  deadline: string;
  submission_link?: string;
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
  completed_at?: string;
}

export interface TaskPhoto {
  id: number;
  task_id: number;
  image_url: string;
  caption?: string;
  created_by?: string;
  created_at: string;
}

export interface TaskWithProgress extends Task {
  progress?: TaskProgress;
  photos?: TaskPhoto[];
}
