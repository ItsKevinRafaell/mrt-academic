"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckSquare, Square, Calendar, Clock, ExternalLink, Image, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskPhoto } from "@/types/task";
import { getTaskPhotos, uploadTaskPhoto, deleteTaskPhoto } from "@/lib/api/tasks";

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  task: TaskWithProgress | null;
  onToggleComplete?: (taskId: number) => void;
}

export interface TaskDrawerTask {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  course_name?: string;
  session_name?: string;
  submission_link?: string;
  progress?: {
    completed: boolean;
    completed_at?: string;
  };
  photos?: TaskPhoto[];
}

export type TaskWithProgress = TaskDrawerTask;

export function TaskDrawer({ open, onClose, task, onToggleComplete }: TaskDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<TaskPhoto[]>(task?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Fetch photos when task changes
  useEffect(() => {
    if (task?.id) {
      setPhotos(task.photos || []);
      getTaskPhotos(task.id)
        .then(setPhotos)
        .catch(console.error);
    }
  }, [task?.id, task?.photos]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!task) return null;

  const handleToggle = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setUploading(true);
    try {
      const newPhoto = await uploadTaskPhoto(task.id, file);
      setPhotos(prev => [newPhoto, ...prev]);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Hapus foto ini?")) return;

    setDeleting(photoId);
    try {
      await deleteTaskPhoto(task!.id, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success("Photo deleted");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const isOverdue = new Date(task.deadline) < new Date() && !task.progress?.completed;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {task.progress?.completed ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">Task Details</h2>
                <p className="text-sm text-muted-foreground">{task.course_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title and Status */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={task.progress?.completed ? "default" : "secondary"}
                  className={cn(
                    task.progress?.completed && "bg-primary text-primary-foreground"
                  )}
                >
                  {task.progress?.completed ? "Completed" : "Pending"}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deadline</span>
              </div>
              <p className="text-foreground font-medium">
                {new Date(task.deadline).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(task.deadline).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Session */}
            {task.session_name && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Session</span>
                </div>
                <p className="text-foreground font-medium">{task.session_name}</p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Description</div>
              <div
                className="prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-li:leading-tight prose-li:py-0 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: task.description || "" }}
              />
            </div>

            {/* Submission Link */}
            {task.submission_link && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Submission Link</div>
                <a
                  href={task.submission_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="underline">Open submission link</span>
                </a>
              </div>
            )}

            {/* Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Photos ({photos.length})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-2">Upload</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={`http://localhost:8080${photo.image_url}`}
                        alt={photo.caption || "Task photo"}
                        className="w-full aspect-square object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={deleting === photo.id}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {deleting === photo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No photos attached</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border space-y-3">
            <Button
              onClick={handleToggle}
              className="w-full"
              variant={task.progress?.completed ? "outline" : "default"}
            >
              {task.progress?.completed ? "Mark as Pending" : "Mark as Complete"}
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
