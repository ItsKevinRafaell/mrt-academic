import { getAllNotes } from "@/lib/api/notes";

export interface NotificationItem {
  id: string;
  type: "task_due" | "task_overdue" | "note";
  title: string;
  message: string;
  href: string;
  timestamp: string;
  read: boolean;
}

// Check for notifications based on tasks due soon
export function getTaskNotifications(tasks: Array<{ id: number; title: string; deadline: string; completed?: boolean }>): NotificationItem[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return tasks
    .filter((t) => !t.completed)
    .map((t) => {
      const deadline = new Date(t.deadline);
      const isOverdue = deadline < now;
      const isDueSoon = deadline <= tomorrow && deadline >= now;

      if (isOverdue) {
        return {
          id: `task-overdue-${t.id}`,
          type: "task_overdue" as const,
          title: "Tugas Terlambat!",
          message: `${t.title} sudah melewati deadline`,
          href: `/tugas`,
          timestamp: t.deadline,
          read: false,
        };
      }
      if (isDueSoon) {
        return {
          id: `task-due-${t.id}`,
          type: "task_due" as const,
          title: "Deadline Dekat",
          message: `${t.title} deadline ${deadline.toLocaleDateString('id-ID')}`,
          href: `/tugas`,
          timestamp: t.deadline,
          read: false,
        };
      }
      return null;
    })
    .filter(Boolean) as NotificationItem[];
}

// Get notification count for badge
export function getNotificationCount(notifications: NotificationItem[]): number {
  return notifications.filter((n) => !n.read).length;
}
