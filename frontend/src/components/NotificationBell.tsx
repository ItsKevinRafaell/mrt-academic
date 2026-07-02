'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, Presentation, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getTasks } from '@/lib/api/tasks';
import { useCourses } from '@/lib/api/courses';
import { getNotifications, markNotificationRead, type Notification } from '@/lib/api/notifications';

interface TaskNotificationItem {
  id: string;
  type: 'overdue' | 'due_soon';
  title: string;
  message: string;
  href: string;
  deadline: string;
}

export function NotificationBell() {
  const [taskNotifications, setTaskNotifications] = useState<TaskNotificationItem[]>([]);
  const [serverNotifications, setServerNotifications] = useState<Notification[]>([]);
  const [presentationModal, setPresentationModal] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);
  const { data: courses = [] } = useCourses();
  const router = useRouter();

  useEffect(() => {
    loadTaskNotifications();
    loadServerNotifications();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      loadServerNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [courses]);

  async function loadTaskNotifications() {
    const items: TaskNotificationItem[] = [];
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
    setTaskNotifications(items);
  }

  async function loadServerNotifications() {
    try {
      const data = await getNotifications(10);
      setServerNotifications(data || []);

      // Check for unread presentation notifications
      const unreadPresentation = data?.find(
        n => !n.is_read && n.type === 'presentation'
      );
      if (unreadPresentation) {
        setPresentationModal(unreadPresentation);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  const handlePresentationAcknowledge = async () => {
    if (presentationModal) {
      try {
        await markNotificationRead(presentationModal.id);
        setPresentationModal(null);
        loadServerNotifications();
      } catch (error) {
        console.error('Failed to acknowledge:', error);
      }
    }
  };

  const handlePresentationClick = async (notif: Notification) => {
    try {
      await markNotificationRead(notif.id);
      setServerNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      if (notif.link) {
        router.push(notif.link);
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const unreadCount = taskNotifications.length + serverNotifications.filter(n => !n.is_read).length;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notifikasi</span>
              <span className="text-xs text-muted-foreground font-normal">
                {unreadCount} notifikasi
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-6">
            {/* Presentation notifications */}
            {serverNotifications.length > 0 && (
              <div className="p-4 border-b">
                <p className="text-xs font-medium text-muted-foreground mb-2">Presentasi</p>
                {serverNotifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handlePresentationClick(n)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 text-left transition ${
                      n.is_read ? 'bg-muted/50' : 'bg-primary/10 hover:bg-primary/20'
                    }`}
                  >
                    <Presentation className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    {!n.is_read && <Badge variant="default" className="shrink-0">Baru</Badge>}
                  </button>
                ))}
              </div>
            )}

            {/* Task notifications */}
            {taskNotifications.length === 0 && serverNotifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi
              </div>
            ) : (
              taskNotifications.map((n) => (
                <a
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-4 hover:bg-muted transition-colors border-b last:border-0"
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
        </DialogContent>
      </Dialog>

      {/* Presentation Modal Popup */}
      {presentationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Presentation className="h-5 w-5 text-primary" />
                {presentationModal.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {presentationModal.message}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handlePresentationAcknowledge}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Baik, Saya Siap
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPresentationModal(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
