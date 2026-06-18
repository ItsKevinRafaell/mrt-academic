import { api, unwrapData } from "./client";

export interface DashboardData {
  active_courses: number;
  pending_tasks: number;
  completed_tasks: number;
  upcoming_events: number;
  upcoming_deadlines?: Deadline[];
}

export interface Deadline {
  id: number;
  title: string;
  course_name: string;
  deadline: string;
}

export interface DashboardSummary {
  total_courses: number;
  pending_tasks: number;
  completed_tasks: number;
  upcoming_events: {
    id: number;
    title: string;
    description: string;
    event_date: string;
    event_type: string;
  }[];
  recent_activities: {
    timestamp: string;
    type: string;
    title: string;
    course_name: string;
  }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await api.get("/dashboard");
  return res.data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get("/dashboard/summary");
  return unwrapData<DashboardSummary>(res);
}
