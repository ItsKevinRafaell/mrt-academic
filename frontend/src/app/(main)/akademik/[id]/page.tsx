"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Video,
  Image,
  Presentation,
  File,
  ClipboardList,
  HelpCircle,
  Calculator,
  Plus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { useCourse } from "@/lib/api/courses";
import { useTopicsByCourse } from "@/lib/api/topics";
import { getTasks, updateTaskProgress } from "@/lib/api/tasks";
import { getQuestions } from "@/lib/api/questions";
import { getGradeComponents, type ComponentWithGrade } from "@/lib/api/grades";
import { GRADE_MAP } from "@/lib/constants/grade-map";
import { QuestionList } from "@/components/bank-soal/question-list";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";
import { CourseDialog } from "./components/CourseDialog";
import { TopicManagementDialog } from "@/components/admin/TopicManagementDialog";
import { GradeComponentManagementDialog } from "@/components/admin/GradeComponentManagementDialog";
import { useConfirm, ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Course, Task, TaskWithProgress, Question } from "@/types";

export default function MatkulDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const matkulId = Number(params.id);
  const tabParam = searchParams.get("tab") || "materi";

  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);
  const { confirm, ConfirmDialog } = useConfirm();

  // React Query hooks with caching
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useCourse(matkulId);
  const { data: topics = [], isLoading: topicsLoading, refetch: refetchTopics } = useTopicsByCourse(matkulId);
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gradeComponents, setGradeComponents] = useState<ComponentWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [monitoringTaskId, setMonitoringTaskId] = useState<number | null>(null);

  // Inline editing state
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");

  // Grade components state (edit handled by dialog)
  const [showGradeComponentDialog, setShowGradeComponentDialog] = useState(false);

  useEffect(() => {
    if (!matkulId) return;
    Promise.all([
      getTasks(matkulId).catch(() => []),
      getQuestions(matkulId).catch(() => []),
      getGradeComponents(matkulId).catch(() => []),
    ])
      .then(([ts, q, gc]) => {
        setTasks(ts || []);
        setQuestions(q || []);
        const componentsWithScore: ComponentWithGrade[] = (gc || []).map((comp) => ({
          ...comp,
          score: null,
        }));
        setGradeComponents(componentsWithScore);
      })
      .finally(() => setLoading(false));
  }, [matkulId]);

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      await updateTaskProgress(taskId, completed);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, progress: { user_id: "", task_id: taskId, completed } }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to update task progress:", error);
      alert("Gagal mengubah status tugas. Silakan coba lagi.");
    }
  };

  // Topic CRUD handlers
  const handleDeleteTopic = async (topicId: number) => {
    await confirm({
      title: "Hapus Topik?",
      description: "Topik akan dihapus. Sesi dan materi di dalamnya tidak akan dihapus.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        const { deleteTopic } = await import("@/lib/api/topics");
        await deleteTopic(topicId);
        refetchTopics();
      },
    });
  };

  // Grade component CRUD handlers
  const handleRefreshComponents = async () => {
    const gc = await getGradeComponents(matkulId);
    setGradeComponents((gc || []).map((comp) => ({ ...comp, score: null })));
  };

  const handleUpdateTopic = async (topicId: number) => {
    if (!editingTopicTitle.trim()) return;
    const { updateTopic } = await import("@/lib/api/topics");
    await updateTopic(topicId, { name: editingTopicTitle, description: "" });
    setEditingTopicId(null);
    setEditingTopicTitle("");
    refetchTopics();
  };

  if (loading) {
    return <MatkulDetailSkeleton />;
  }

  if (!course) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Mata kuliah tidak ditemukan</p>
          <Button variant="link" asChild>
            <Link href="/akademik">Kembali ke Akademik</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const materialIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "video":
      case "youtube":
        return <Video className="h-4 w-4 text-purple-500" />;
      case "image":
        return <Image className="h-4 w-4 text-green-500" />;
      case "ppt":
        return <Presentation className="h-4 w-4 text-orange-500" />;
      case "link":
        return <LinkIcon className="h-4 w-4 text-primary" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <PageContainer className="space-y-4 lg:space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Akademik", href: "/akademik" },
          { label: course.name },
        ]}
      />

      {/* Course header */}
      <div className="rounded-lg border bg-card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline">{course.code}</Badge>
              <Badge variant="secondary">{course.sks} SKS</Badge>
              {course.cawu_id && <Badge>Cawu {course.cawu_id}</Badge>}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold">{course.name}</h1>
            {course.description && (
              <p className="text-muted-foreground mt-1 text-sm">{course.description}</p>
            )}
            {course.instructors && course.instructors.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Dosen: {course.instructors.join(", ")}
              </p>
            )}
          </div>
          {/* Kurikulum controls */}
          {isKurikulum && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCourseDialog(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTopicDialog(true)}
              >
                Kelola Topik
              </Button>
              {isKurikulum && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGradeComponentDialog(true)}
                >
                  Kelola Penilaian
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="relative">
          <TabsList className="w-full inline-flex gap-1 p-1 h-auto bg-muted rounded-lg overflow-x-auto scrollbar-none">
            <TabsTrigger value="materi" className="flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap data-[state=active]:bg-background">
              <BookOpen className="h-3.5 w-3.5" />
              Materi
            </TabsTrigger>
            <TabsTrigger value="tugas" className="flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap data-[state=active]:bg-background">
              <ClipboardList className="h-3.5 w-3.5" />
              Tugas
            </TabsTrigger>
            <TabsTrigger value="bank-soal" className="flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap data-[state=active]:bg-background">
              <HelpCircle className="h-3.5 w-3.5" />
              Bank Soal
            </TabsTrigger>
            <TabsTrigger value="nilai" className="flex items-center gap-1 px-3 py-1.5 text-xs whitespace-nowrap data-[state=active]:bg-background">
              <Calculator className="h-3.5 w-3.5" />
              Nilai
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Materi Tab */}
        <TabsContent value="materi" className="mt-4">
          {topics.length === 0 ? (
            <EmptyState icon={BookOpen} title="Belum ada topik tersedia" />
          ) : (
            <div className="grid gap-3">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/akademik/${matkulId}/topik/${topic.id}`}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium group-hover:text-primary transition-colors">{topic.title}</p>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">Topik</Badge>
                    {isKurikulum && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditingTopicId(topic.id); setEditingTopicTitle(topic.title); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteTopic(topic.id); }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tugas Tab */}
        <TabsContent value="tugas" className="mt-4">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada tugas untuk matkul ini"
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isCompleted = task.progress?.completed;
                return (
                  <button
                    key={task.id}
                    onClick={() => router.push(`/tugas/${task.id}?back=/akademik/${matkulId}?tab=tugas`)}
                    className="flex items-center gap-2 lg:gap-3 w-full text-left rounded-lg border p-3 lg:p-4 hover:bg-accent transition-colors"
                  >
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isCompleted && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deadline:{" "}
                        {new Date(task.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {isKurikulum && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMonitoringTaskId(task.id);
                        }}
                        className="mr-2 shrink-0"
                      >
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Monitoring</span>
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge variant="success" className="text-xs shrink-0">
                        Selesai
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Bank Soal Tab */}
        <TabsContent value="bank-soal" className="mt-4">
          <QuestionList questions={questions} courseId={matkulId} />
        </TabsContent>

        {/* Nilai Tab - Static Breakdown */}
        <TabsContent value="nilai" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Komponen Penilaian
                </CardTitle>
                {isKurikulum && (
                  <Button size="sm" onClick={() => setShowGradeComponentDialog(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Kelola Komponen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {gradeComponents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada komponen penilaian untuk mata kuliah ini
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {gradeComponents.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{comp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Bobot: {comp.weight}%
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm lg:text-lg font-semibold">
                            {comp.score != null ? comp.score.toFixed(1) : "-"}
                          </div>
                          {comp.score != null && (
                            <div className="text-xs text-muted-foreground">
                              = {((comp.score * comp.weight) / 100).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Bobot</div>
                        <div className="text-lg font-semibold">
                          {gradeComponents.reduce((sum, c) => sum + c.weight, 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Nilai Akhir</div>
                        <div className="text-xl lg:text-2xl font-bold text-primary">
                          {(() => {
                            const totalWeight = gradeComponents.reduce((sum, c) => sum + c.weight, 0);
                            if (totalWeight === 0) return "-";
                            const weighted = gradeComponents.reduce((sum, c) => {
                              if (c.score == null) return sum;
                              return sum + (c.score * c.weight) / 100;
                            }, 0);
                            return weighted.toFixed(2);
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const totalWeight = gradeComponents.reduce((sum, c) => sum + c.weight, 0);
                            if (totalWeight === 0) return "-";
                            const weighted = gradeComponents.reduce((sum, c) => {
                              if (c.score == null) return sum;
                              return sum + (c.score * c.weight) / 100;
                            }, 0);
                            const grade = GRADE_MAP.find((g) => weighted >= g.min);
                            return grade ? `Grade: ${grade.grade}` : "-";
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Edit Dialog */}
      <CourseDialog
        open={showCourseDialog}
        onOpenChange={setShowCourseDialog}
        course={course}
        onSaved={() => setShowCourseDialog(false)}
      />

      {/* Topic Management Dialog */}
      <TopicManagementDialog
        open={showTopicDialog}
        onOpenChange={setShowTopicDialog}
        courses={[course]}
        initialCourse={course}
      />

      {/* Grade Component Management Dialog */}
      <GradeComponentManagementDialog
        open={showGradeComponentDialog}
        onOpenChange={(open) => {
          setShowGradeComponentDialog(open);
          if (!open) handleRefreshComponents();
        }}
        course={course}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />

      {/* Monitoring Modal */}
      {monitoringTaskId && (
        <TaskDetailModal
          taskId={monitoringTaskId}
          open={!!monitoringTaskId}
          onOpenChange={(open) => !open && setMonitoringTaskId(null)}
        />
      )}
    </PageContainer>
  );
}

function MatkulDetailSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-lg border p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
