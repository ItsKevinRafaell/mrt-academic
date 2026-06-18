"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getActiveSession } from "@/lib/api/calendar";
import { getCourses } from "@/lib/api/courses";
import { getTopicsByCourse } from "@/lib/api/topics";
import { getSessions } from "@/lib/api/sessions";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Course, Topic } from "@/types";

const formSchema = z.object({
  course_id: z.string().min(1, "Mata kuliah harus dipilih"),
  topic_id: z.string().optional(),
  session_id: z.string().optional(),
  material_title: z.string().min(1, "Judul materi harus diisi"),
  material_description: z.string().optional(),
  material_type: z.enum(["pdf", "link", "video", "photo"]),
  material_url: z.string().optional(),
  photo_caption: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SmartAddButtonProps {
  onSuccess: () => void;
}

export function SmartAddButton({ onSuccess }: SmartAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, role } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_id: "",
      topic_id: "",
      session_id: "",
      material_title: "",
      material_description: "",
      material_type: "pdf",
      material_url: "",
      photo_caption: "",
    },
  });

  const isKurikulum = role === "KURIKULUM" || role === "SUPER_ADMIN";

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      // Load courses
      const coursesData = await getCourses();
      setCourses(coursesData);

      // Try to detect active session
      const activeSession = await getActiveSession();
      if (activeSession) {
        // Auto-fill form with active session data
        form.setValue("course_id", activeSession.course_id.toString());
        if (activeSession.session_id) {
          form.setValue("session_id", activeSession.session_id.toString());
        }

        // Load topics and sessions for the active course
        await loadCourseData(activeSession.course_id);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadCourseData = async (courseId: number) => {
    try {
      const [topicsData, sessionsData] = await Promise.all([
        getTopicsByCourse(courseId),
        getSessions(courseId),
      ]);
      setTopics(topicsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Failed to load course data:", error);
    }
  };

  const handleCourseChange = async (courseId: string) => {
    form.setValue("course_id", courseId);
    form.setValue("topic_id", "");
    form.setValue("session_id", "");
    await loadCourseData(parseInt(courseId));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Here you would call the appropriate API to create material/photo
      // For now, just log the data
      console.log("Form data:", data);

      // Reset form and close dialog
      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isKurikulum) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Materi Baru</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Selection */}
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mata Kuliah</FormLabel>
                  <Select
                    onValueChange={handleCourseChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mata kuliah" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic Selection (Optional) */}
            <FormField
              control={form.control}
              name="topic_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topik (Opsional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih topik" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Session Selection (Optional) */}
            <FormField
              control={form.control}
              name="session_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sesi (Opsional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sesi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id.toString()}>
                          Sesi {session.number}: {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Type */}
            <FormField
              control={form.control}
              name="material_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Materi</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis materi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="photo">Foto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Title */}
            <FormField
              control={form.control}
              name="material_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Materi</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul materi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Description */}
            <FormField
              control={form.control}
              name="material_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan deskripsi materi"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material URL */}
            <FormField
              control={form.control}
              name="material_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Materi (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/material.pdf"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Caption (only for photo type) */}
            {form.watch("material_type") === "photo" && (
              <FormField
                control={form.control}
                name="photo_caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption Foto (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan caption untuk foto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
