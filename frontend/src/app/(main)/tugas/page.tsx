"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, CheckCircle2, Clock, BookOpen, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourses } from "@/lib/api/courses";
import { updateTaskProgress, type TaskWithProgress } from "@/lib/api/tasks";
import { useCawuStore } from "@/lib/stores/cawu-store";
import { TaskModal } from "@/components/tugas/task-modal";

export default function TasksPage() {
  const router = useRouter();
  const { selectedCawu } = useCawuStore();
  const { data: courses = [] } = useCourses();
  const [allTasks, setAllTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline-asc" | "deadline-desc" | "name">("deadline-asc");
  const [selectedTask, setSelectedTask] = useState<TaskWithProgress | null>(null);

  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = async () => {
    setLoading(true);
    try {
      const { getTasks } = await import("@/lib/api/tasks");
      const tasksPromises = courses.map((c) => getTasks(c.id));
      const tasksArrays = await Promise.all(tasksPromises);
      const flatTasks = tasksArrays.flat();
      setAllTasks(flatTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId: number, completed: boolean) => {
    try {
      await updateTaskProgress(taskId, completed);
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, progress: { user_id: "", task_id: taskId, completed } }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to toggle task:", error);
      alert("Gagal mengubah status tugas");
    }
  };

  // Filter tasks
  const filteredTasks = allTasks.filter((task) => {
    // Filter by status
    if (filterStatus === "completed" && !task.progress?.completed) return false;
    if (filterStatus === "pending" && task.progress?.completed) return false;
    // Filter by course
    if (filterCourse !== "all" && task.course_id !== parseInt(filterCourse)) return false;
    return true;
  });

  // Sort tasks based on selected option
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline-asc") {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortBy === "deadline-desc") {
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  // Group by completion status
  const pendingTasks = sortedTasks.filter((t) => !t.progress?.completed);
  const completedTasks = sortedTasks.filter((t) => t.progress?.completed);

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : "Unknown";
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Tugas
        </h1>
        <p className="text-muted-foreground mt-1">
          {allTasks.length} tugas tersedia
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending">Belum Selesai</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter berdasarkan mata kuliah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Kuliah</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={String(course.id)}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline-asc">Deadline ↑</SelectItem>
              <SelectItem value="deadline-desc">Deadline ↓</SelectItem>
              <SelectItem value="name">Nama A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Belum Selesai ({pendingTasks.length})
          </h2>
          {pendingTasks.map((task) => (
            <Card
              key={task.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                isOverdue(task.deadline) ? "border-destructive/50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={() => handleToggle(task.id, true)}
                    className="h-6 w-6 rounded-full border-2 border-muted-foreground hover:border-green-500 hover:bg-green-500/10 transition-colors shrink-0"
                  />
                  <div className="flex-1 min-w-0" onClick={() => setSelectedTask(task)}>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      {isOverdue(task.deadline) && (
                        <Badge variant="destructive" className="text-xs shrink-0">Terlambat</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {getCourseName(task.course_id)}
                      </span>
                      <span>•</span>
                      <span>
                        Deadline: {new Date(task.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/akademik/${task.course_id}?tab=tugas`)}
                    className="shrink-0"
                  >
                    Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Selesai ({completedTasks.length})
          </h2>
          {completedTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-shadow cursor-pointer opacity-75"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(task.id, false)}
                    className="h-6 w-6 rounded-full bg-green-500 border-2 border-green-500 hover:border-muted-foreground hover:bg-transparent transition-colors shrink-0 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => setSelectedTask(task)}>
                    <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {getCourseName(task.course_id)}
                      </span>
                      {task.progress?.completed_at && (
                        <>
                          <span>•</span>
                          <span>
                            Selesai: {new Date(task.progress.completed_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/akademik/${task.course_id}?tab=tugas`)}
                  >
                    Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada tugas</p>
            <p className="text-muted-foreground mt-1">
              {filterStatus !== "all" || filterCourse !== "all"
                ? "Coba ubah filter untuk melihat tugas lainnya"
                : "Semua tugas sudah selesai!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggleComplete={(id, completed) => handleToggle(id, completed)}
        />
      )}
    </div>
  );
}
