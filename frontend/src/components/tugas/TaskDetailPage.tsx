"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Calendar,
  Clock,
  ExternalLink,
  Image,
  Upload,
  Trash2,
  Loader2,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaskPhotos, uploadTaskPhoto, deleteTaskPhoto, updateTaskProgress } from "@/lib/api/tasks";
import type { TaskPhoto } from "@/types";

interface Task {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  deadline: string;
  submission_link?: string;
  created_at: string;
  updated_at: string;
  progress?: {
    completed: boolean;
    completed_at?: string;
  };
}

interface Course {
  id: number;
  code: string;
  name: string;
}

interface TaskDetailPageProps {
  defaultBackUrl?: string;
}

export default function TaskDetailPage({ defaultBackUrl }: TaskDetailPageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Back URL: from prop, then searchParams, then default
  const backUrl = searchParams.get("back") || defaultBackUrl || "/tugas";
  const backLabel = searchParams.get("back") ? "Kembali" : "Kembali ke Daftar Tugas";

  const [task, setTask] = useState<Task | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [photos, setPhotos] = useState<TaskPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getTasks } = await import("@/lib/api/tasks");
      const { getCourses, getCourse } = await import("@/lib/api/courses");

      // First get all courses, then find the task
      const courses = await getCourses();

      for (const c of courses) {
        const courseTasks = await getTasks(c.id);
        const found = courseTasks.find((t: Task) => t.id === taskId);
        if (found) {
          setTask(found);
          // Get full course data
          const fullCourse = await getCourse(c.id);
          setCourse(fullCourse);
          break;
        }
      }

      // Load photos
      const taskPhotos = await getTaskPhotos(taskId);
      setPhotos(taskPhotos);
    } catch (error) {
      console.error("Failed to load task:", error);
      toast.error("Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!task) return;

    setToggling(true);
    try {
      const newStatus = !task.progress?.completed;
      await updateTaskProgress(task.id, newStatus);
      setTask({
        ...task,
        progress: { ...task.progress!, completed: newStatus }
      });
      toast.success(newStatus ? "Tugas ditandai selesai" : "Tugas ditandai belum selesai");
    } catch (error) {
      toast.error("Gagal mengubah status");
    } finally {
      setToggling(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const newPhoto = await uploadTaskPhoto(taskId, file);
      setPhotos(prev => [newPhoto, ...prev]);
      toast.success("Foto berhasil diupload");
    } catch (error) {
      toast.error("Upload gagal");
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
      await deleteTaskPhoto(taskId, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success("Foto dihapus");
    } catch (error) {
      toast.error("Gagal menghapus foto");
    } finally {
      setDeleting(null);
    }
  };

  const isOverdue = task && new Date(task.deadline) < new Date() && !task.progress?.completed;

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tugas tidak ditemukan</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/tugas")}>
              Kembali ke Daftar Tugas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(backUrl)}
        className="pl-0"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {backLabel}
      </Button>

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className="shrink-0"
                >
                  {task.progress?.completed ? (
                    <CheckSquare className="h-8 w-8 text-primary" />
                  ) : (
                    <Square className="h-8 w-8 text-muted-foreground" />
                  )}
                </button>
                <div>
                  <CardTitle className={cn(
                    "text-2xl",
                    task.progress?.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </CardTitle>
                  {course && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.code} - {course.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Badge
                  variant={task.progress?.completed ? "default" : "secondary"}
                  className={cn(
                    task.progress?.completed && "bg-green-500"
                  )}
                >
                  {task.progress?.completed ? "Selesai" : "Belum Selesai"}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">Terlambat</Badge>
                )}
              </div>
            </div>

            <Button
              variant={task.progress?.completed ? "outline" : "default"}
              onClick={handleToggle}
              disabled={toggling}
              className="shrink-0"
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                task.progress?.completed ? "Tandai Belum Selesai" : "Tandai Selesai"
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Deadline */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Deadline</p>
              <p className="text-muted-foreground">
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
                })} WIB
              </p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-5 w-5" />
                <span>Deskripsi</span>
              </div>
              <div
                className="prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-li:leading-tight prose-li:py-0 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          )}

          {/* Submission Link */}
          {task.submission_link && (
            <div className="space-y-2">
              <p className="font-medium">Link Pengumpulan</p>
              <a
                href={task.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="underline">{task.submission_link}</span>
              </a>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Image className="h-5 w-5" />
                <span>Foto / Lampiran ({photos.length})</span>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deleting === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    {photo.caption && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                Belum ada foto lampiran
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
