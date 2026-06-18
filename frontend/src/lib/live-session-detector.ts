import { getCalendarEvents } from "@/lib/api/calendar";
import type { CalendarEvent } from "@/types/calendar";

export interface LiveSession {
  event: CalendarEvent;
  isActive: boolean;
  timeRemaining: number; // in seconds
}

export async function detectLiveSession(): Promise<LiveSession | null> {
  try {
    const events = await getCalendarEvents();
    const now = new Date();

    for (const event of events) {
      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);

      // Check if current time is within event time range
      if (now >= startTime && now <= endTime) {
        const timeRemaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);

        return {
          event,
          isActive: true,
          timeRemaining,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to detect live session:", error);
    return null;
  }
}

export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}j ${minutes}m ${secs}d`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}d`;
  } else {
    return `${secs}d`;
  }
}

export function isSessionActive(event: CalendarEvent): boolean {
  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  return now >= startTime && now <= endTime;
}

export function getSessionTimeRemaining(event: CalendarEvent): number {
  const now = new Date();
  const endTime = new Date(event.end_time);
  return Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
}
