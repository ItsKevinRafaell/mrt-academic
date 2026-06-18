/**
 * Smart Schedule Auto-Fill System
 * Detects current WIB time and matches with course schedules
 */

export interface CourseSchedule {
  courseId: number;
  courseName: string;
  courseCode: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc
  startTime: string; // "HH:mm" format in WIB
  endTime: string; // "HH:mm" format in WIB
  currentSessionId?: number;
  currentSessionTitle?: string;
}

export interface ActiveClass {
  courseId: number;
  courseName: string;
  courseCode: string;
  sessionId?: number;
  sessionTitle?: string;
  startTime: string;
  endTime: string;
  isCurrentlyActive: boolean;
}

/**
 * Get current time in WIB (UTC+7)
 */
export function getCurrentWIBTime(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utcTime + (7 * 3600000));
  return wibTime;
}

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within a schedule
 */
export function isTimeInSchedule(currentTime: Date, schedule: CourseSchedule): boolean {
  const currentDay = currentTime.getDay();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  if (currentDay !== schedule.dayOfWeek) return false;

  const startMinutes = parseTimeToMinutes(schedule.startTime);
  const endMinutes = parseTimeToMinutes(schedule.endTime);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Find active class based on current WIB time
 */
export function findActiveClass(schedules: CourseSchedule[]): ActiveClass | null {
  const currentTime = getCurrentWIBTime();

  for (const schedule of schedules) {
    if (isTimeInSchedule(currentTime, schedule)) {
      return {
        courseId: schedule.courseId,
        courseName: schedule.courseName,
        courseCode: schedule.courseCode,
        sessionId: schedule.currentSessionId,
        sessionTitle: schedule.currentSessionTitle,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isCurrentlyActive: true,
      };
    }
  }

  return null;
}

/**
 * Get upcoming class (next 30 minutes)
 */
export function getUpcomingClass(schedules: CourseSchedule[]): ActiveClass | null {
  const currentTime = getCurrentWIBTime();
  const currentDay = currentTime.getDay();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const upcoming = schedules
    .filter(s => s.dayOfWeek === currentDay)
    .map(s => ({
      ...s,
      startMinutes: parseTimeToMinutes(s.startTime),
    }))
    .filter(s => s.startMinutes > currentMinutes && s.startMinutes <= currentMinutes + 30)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  return {
    courseId: next.courseId,
    courseName: next.courseName,
    courseCode: next.courseCode,
    sessionId: next.currentSessionId,
    sessionTitle: next.currentSessionTitle,
    startTime: next.startTime,
    endTime: next.endTime,
    isCurrentlyActive: false,
  };
}
