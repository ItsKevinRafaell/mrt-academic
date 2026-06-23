"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Calendar, Users } from "lucide-react";
import { getTaskDetail } from "@/lib/api/monitoring";

interface TaskDetailModalProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TaskDetail {
  task: {
    id: number;
    course_id: number;
    title: string;
    description: string;
    deadline: string;
    submission_link: string;
    created_at: string;
    updated_at: string;
  };
  total_students: number;
  completed_students: Array<{
    user_id: string;
    task_id: number;
    completed: boolean;
    completed_at: string;
    user_name: string;
    user_email: string;
  }>;
  pending_students: Array<{
    user_id: string;
    task_id: number;
    completed: boolean;
    completed_at: string | null;
    user_name: string;
    user_email: string;
  }>;
  completion_rate: number;
}

export function TaskDetailModal({ taskId, open, onOpenChange }: TaskDetailModalProps) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      setLoading(true);
      getTaskDetail(taskId)
        .then(setDetail)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, taskId]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!detail) return null;

  const deadlineDate = new Date(detail.task.deadline);
  const now = new Date();
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{detail.task.title}</span>
            <Badge variant={detail.completion_rate >= 80 ? "success" : detail.completion_rate >= 50 ? "secondary" : "destructive"}>
              {detail.completion_rate.toFixed(1)}%
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <div
                className="prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-li:leading-tight prose-li:py-0"
                dangerouslySetInnerHTML={{ __html: detail.task.description || "No description" }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Deadline: {deadlineDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={daysRemaining <= 3 ? "text-red-500 font-medium" : ""}>
                  {daysRemaining > 0 ? `${daysRemaining} hari lagi` : "Sudah lewat deadline"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Total: {detail.total_students} mahasiswa</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {detail.completed_students.length} dari {detail.total_students} mahasiswa sudah selesai
              </span>
              <span className="font-medium">{detail.completion_rate.toFixed(1)}%</span>
            </div>
            <Progress value={detail.completion_rate} className="h-3" />
          </div>

          {/* Students Lists */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Completed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Sudah Selesai ({detail.completed_students.length})</h3>
              </div>
              <div className="rounded-md border overflow-hidden">
                {detail.completed_students.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Belum ada yang selesai
                  </div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {detail.completed_students.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.user_email}</p>
                        </div>
                        {student.completed_at && (
                          <div className="text-xs text-muted-foreground ml-2">
                            {new Date(student.completed_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Belum Selesai ({detail.pending_students.length})</h3>
              </div>
              <div className="rounded-md border overflow-hidden">
                {detail.pending_students.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Semua sudah selesai! 🎉
                  </div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {detail.pending_students.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.user_email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
