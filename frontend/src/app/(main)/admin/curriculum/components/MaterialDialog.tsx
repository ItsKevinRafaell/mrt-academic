"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMaterial } from "@/lib/api/materials";
import { getActiveSchedule } from "@/lib/api/schedules";
import { findActiveClass, type CourseSchedule } from "@/lib/utils/schedule";
import { Upload, X, FileText } from "lucide-react";
import type { Course, Session } from "@/types";

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  sessions: Session[];
  onSaved: () => void;
}

export function MaterialDialog({ open, onOpenChange, courses, sessions, onSaved }: MaterialDialogProps) {
  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pdf");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [activeClass, setActiveClass] = useState<CourseSchedule | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setCourseId("");
      setSessionId("");
      setTitle("");
      setType("pdf");
      setUrl("");
      setDescription("");
      setAutoFilled(false);
      setActiveClass(null);
      checkActiveSchedule();
    }
  }, [open]);

  async function checkActiveSchedule() {
    try {
      const schedules = await getActiveSchedule();
      if (schedules && schedules.length > 0) {
        const schedule = schedules[0];
        const courseSchedule: CourseSchedule = {
          courseId: schedule.course_id,
          courseName: schedule.course_name || "",
          courseCode: schedule.course_code || "",
          dayOfWeek: schedule.day_of_week,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          currentSessionId: schedule.session_id || undefined,
          currentSessionTitle: "",
        };
        setActiveClass(courseSchedule);
        setCourseId(schedule.course_id.toString());
        if (schedule.session_id) {
          setSessionId(schedule.session_id.toString());
        } else {
          const courseSessions = sessions.filter(s => s.course_id === schedule.course_id);
          if (courseSessions.length > 0) {
            setSessionId(courseSessions[0].id.toString());
          }
        }
        setAutoFilled(true);
        setStep(2);
      }
    } catch (err) {
      console.error("Failed to fetch active schedule:", err);
    }
  }

  const courseSessions = sessions.filter(s => s.course_id === Number(courseId));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setType('image');
      } else {
        setImagePreview(null);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  async function handleSubmit() {
    setSaving(true);
    try {
      let finalUrl = url;

      // If file is selected, convert to base64 (for now, later can upload to server)
      if (selectedFile) {
        finalUrl = await fileToBase64(selectedFile);
      }

      if (!finalUrl) {
        alert("Harap masukkan URL atau upload file");
        setSaving(false);
        return;
      }

      await createMaterial({
        session_id: Number(sessionId),
        title,
        type: type as any,
        url: finalUrl,
        description: description || undefined,
      });
      onSaved();
      onOpenChange(false);
    } catch {
      alert("Gagal menambah materi");
    } finally {
      setSaving(false);
    }
  }

  function handleCourseChange(newCourseId: string) {
    setCourseId(newCourseId);
    setSessionId("");
    setAutoFilled(false);
    setActiveClass(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Materi Baru</DialogTitle>
          <p className="text-sm text-muted-foreground">Langkah {step} dari 3</p>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {autoFilled && activeClass && (
          <div className="bg-primary/5 border-l-4 border-primary p-3 mb-4 rounded">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  ⏰ Auto-filled: {activeClass.courseName}
                </p>
                <p className="text-xs text-primary/80">
                  Kelas sedang berlangsung ({activeClass.startTime} - {activeClass.endTime})
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mata Kuliah</Label>
              <Select value={courseId} onValueChange={(v) => { handleCourseChange(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sesi</Label>
              <Select value={sessionId} onValueChange={setSessionId} disabled={!courseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sesi" />
                </SelectTrigger>
                <SelectContent>
                  {courseSessions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      Sesi {s.number}: {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button onClick={() => setStep(2)} disabled={!courseId || !sessionId}>
                Lanjut
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Materi</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bab 1 - Pengantar"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="ppt">PowerPoint</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL / Link atau Upload File</Label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (e.target.value) {
                      setSelectedFile(null);
                      setImagePreview(null);
                    }
                  }}
                  placeholder="https://..."
                  disabled={!!selectedFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!url}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-32 object-contain rounded-md border"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Deskripsi (opsional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi materi..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button onClick={() => setStep(3)} disabled={!title || (!url && !selectedFile)}>
                Lanjut
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mata Kuliah</span>
                  <span className="text-sm font-medium">
                    {courses.find((c) => String(c.id) === courseId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sesi</span>
                  <span className="text-sm font-medium">
                    {courseSessions.find((s) => String(s.id) === sessionId)?.title || `Sesi ${sessionId}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Judul</span>
                  <span className="text-sm font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipe</span>
                  <Badge variant="outline">{type.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? "File" : "URL"}
                  </span>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : url}
                  </span>
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-32 object-contain rounded-md border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>
                Kembali
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Materi"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
