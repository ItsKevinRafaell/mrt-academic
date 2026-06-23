"use client";
import { useState } from "react";
import { ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TaskWithProgress } from "@/types";

interface TaskModalProps {
  task: TaskWithProgress;
  open: boolean;
  onClose: () => void;
  onToggleComplete: (taskId: number, completed: boolean) => void;
}

export function TaskModal({
  task,
  open,
  onClose,
  onToggleComplete,
}: TaskModalProps) {
  const [toggling, setToggling] = useState(false);
  const isCompleted = task.progress?.completed;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleComplete(task.id, !isCompleted);
      onClose();
    } finally {
      setToggling(false);
    }
  };

  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  const isOverdue = !isCompleted && deadlineDate < now;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {task.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Deadline:{" "}
            {deadlineDate.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOverdue && (
              <Badge variant="destructive" className="ml-2">
                Terlambat
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {task.description && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Deskripsi</h4>
            <div
              className="prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-li:leading-tight prose-li:py-0 text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </div>
        )}

        {task.submission_link && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Link Pengumpulan</h4>
            <a
              href={task.submission_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Buka link pengumpulan
            </a>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={handleToggle}
            disabled={toggling}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? "Tandai Belum Selesai" : "Tandai Selesai"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
