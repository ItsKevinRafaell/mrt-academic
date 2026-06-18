export type { User, Role, AuthResponse, LoginInput, RegisterInput } from "./user";
export type { Course, CourseInput } from "./course";
export type { Session, SessionInput } from "./session";
export type { MaterialType, Material, MaterialInput, SessionWithMaterials } from "./material";
export type { Task, TaskInput, TaskProgress, TaskWithProgress } from "./task";
export type { EventCategory, AcademicEvent, EventInput } from "./event";
export type {
  QuestionType,
  DifficultyLevel,
  QuestionOption,
  Question,
  QuestionInput,
  ExamSubmission,
} from "./question";
export type { Grade, IPKEntry, IPKCawu, IPKSummary, IPKData, GradeComponent, GradeComponentWithScore } from "./ipk";
export type { BaseSuccessResponse, BaseErrorResponse, ApiResponse } from "./api";
export type { Topic, TopicWithSessions } from "./topic";
export type { Schedule, ScheduleInput } from "./schedule";

// Dashboard types
export interface DashboardData {
  total_courses: number;
  pending_tasks: number;
  completed_tasks: number;
  upcoming_events: any[];
  recent_activities: any[];
}
