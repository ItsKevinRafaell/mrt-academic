"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTasks } from "@/lib/api/tasks";
import { useAuthStore } from "@/lib/stores/auth-store";

interface Task {
  id: number;
  title: string;
  deadline: string;
  course_id: number;
  course_name?: string;
}

export default function DeadlineSidebar() {
  const pathname = usePathname();
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract courseId from pathname if on course page
  const courseMatch = pathname?.match(/\/akademik\/(\d+)/);
  const courseId = courseMatch ? parseInt(courseMatch[1]) : null;

  useEffect(() => {
    if (!token) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        let allTasks: Task[] = [];

        if (courseId) {
          // Fetch tasks for specific course
          const courseTasks = await getTasks(courseId);
          allTasks = courseTasks.map(t => ({ ...t, course_name: "Current Course" }));
        } else {
          // Fetch all tasks (you may need to fetch from all courses)
          // For now, we'll fetch from a known course ID
          const tasks = await getTasks(1);
          allTasks = tasks.map(t => ({ ...t, course_name: "Course" }));
        }

        // Filter upcoming deadlines
        const now = new Date();
        const upcoming = allTasks.filter(task => {
          const deadline = new Date(task.deadline);
          return deadline > now;
        });

        // Sort by deadline
        upcoming.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        setTasks(upcoming.slice(0, 10)); // Show top 10
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token, courseId]);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    if (days < 7) return `${days} hari lagi`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const getDeadlineColor = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 1) return "text-destructive";
    if (days <= 3) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-20 z-40 shadow-lg animate-in fade-in slide-in-from-right-2"
          onClick={() => setIsOpen(true)}
        >
          <Calendar className="h-5 w-5" />
          {tasks.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground">
              {tasks.length}
            </Badge>
          )}
        </Button>
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Deadline {courseId ? "Matkul" : "Semua"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Memuat deadline...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Tidak ada deadline mendatang
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-sm mb-1">{task.title}</div>
                  {task.course_name && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {task.course_name}
                    </div>
                  )}
                  <div className={`text-xs font-medium ${getDeadlineColor(task.deadline)}`}>
                    {formatDeadline(task.deadline)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
