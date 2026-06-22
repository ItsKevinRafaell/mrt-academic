'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getTasks, type TaskWithProgress } from '@/lib/api/tasks';
import { useCourses } from '@/lib/api/courses';

interface NotificationItem {
  id: string;
  type: 'overdue' | 'due_soon';
  title: string;
  message: string;
  href: string;
  deadline: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const { data: courses = [] } = useCourses();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const items: NotificationItem[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const course of courses) {
      try {
        const tasks = await getTasks(course.id);
        for (const task of tasks) {
          if ((task as any).progress?.completed) continue;
          const deadline = new Date(task.deadline);
          if (deadline < now) {
            items.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              title: 'Tugas Terlambat!',
              message: `${task.title} — ${course.code}`,
              href: `/tugas`,
              deadline: task.deadline,
            });
          } else if (deadline <= tomorrow) {
            items.push({
              id: `due-${task.id}`,
              type: 'due_soon',
              title: 'Deadline Dekat',
              message: `${task.title} — ${course.code}`,
              href: `/tugas`,
              deadline: task.deadline,
            });
          }
        }
      } catch {
        // skip course if tasks fail to load
      }
    }

    items.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setNotifications(items);
  }

  const unread = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] min-w-5"
            >
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          <p className="text-xs text-muted-foreground">
            {unread} tugas perlu perhatian
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((n) => (
              <a
                key={n.id}
                href={n.href}
                className="flex items-start gap-3 p-3 hover:bg-muted transition-colors border-b last:border-0"
              >
                <div className="mt-0.5">
                  {n.type === 'overdue' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </a>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
