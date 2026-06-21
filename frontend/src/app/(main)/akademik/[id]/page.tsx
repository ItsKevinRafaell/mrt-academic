"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useCourse } from "@/lib/api/courses";
import { useTopicsWithSessions } from "@/lib/api/topics";
import { getTasks, updateTaskProgress } from "@/lib/api/tasks";
import { getQuestions } from "@/lib/api/questions";
import { getGradeComponents, type ComponentWithGrade } from "@/lib/api/grades";
import { GRADE_MAP } from "@/lib/constants/grade-map";
import { TaskModal } from "@/components/tugas/task-modal";
import { QuestionList } from "@/components/bank-soal/question-list";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";
import { CourseDialog } from "./components/CourseDialog";
import { TopicManagementDialog } from "@/components/admin/TopicManagementDialog";
import { useConfirm, ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import type { Course, TopicWithSessions, SessionWithMaterials, Task, TaskWithProgress, Question } from "@/types";

export default function MatkulDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matkulId = Number(params.id);
  const tabParam = searchParams.get("tab") || "materi";
  const sessionParam = searchParams.get("session");

  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);
  const { confirm, ConfirmDialog } = useConfirm();

  // React Query hooks with caching
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useCourse(matkulId);
  const { data: topics = [], isLoading: topicsLoading, refetch: refetchTopics } = useTopicsWithSessions(matkulId);
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gradeComponents, setGradeComponents] = useState<ComponentWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [monitoringTaskId, setMonitoringTaskId] = useState<number | null>(null);

  // Inline editing state
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");
  const [showQuickAddSession, setShowQuickAddSession] = useState<number | null>(null);
  const [quickAddSessionTitle, setQuickAddSessionTitle] = useState("");

  // Grade components CRUD state
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentWeight, setNewComponentWeight] = useState("");

  const sessionRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to session if deep-linked
  useEffect(() => {
    if (sessionParam && sessionRef.current) {
      sessionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionParam, topics]);

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
  const handleAddComponent = async () => {
    if (!newComponentName.trim() || !newComponentWeight) return;
    try {
      const { createGradeComponent } = await import("@/lib/api/grades");
      await createGradeComponent(matkulId, newComponentName, parseFloat(newComponentWeight), "default");
      setNewComponentName("");
      setNewComponentWeight("");
      setShowAddComponent(false);
      // Refresh grade components
      const gc = await getGradeComponents(matkulId);
      setGradeComponents((gc || []).map((comp) => ({ ...comp, score: null })));
    } catch (error) {
      console.error("Failed to add component:", error);
      alert("Gagal menambahkan komponen");
    }
  };

  const handleDeleteComponent = async (componentId: number) => {
    await confirm({
      title: "Hapus Komponen?",
      description: "Komponen penilaian akan dihapus.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        const { deleteGradeComponent } = await import("@/lib/api/grades");
        await deleteGradeComponent(componentId);
        const gc = await getGradeComponents(matkulId);
        setGradeComponents((gc || []).map((comp) => ({ ...comp, score: null })));
      },
    });
  };

  const handleUpdateTopic = async (topicId: number) => {
    if (!editingTopicTitle.trim()) return;
    const { updateTopic } = await import("@/lib/api/topics");
    await updateTopic(topicId, { name: editingTopicTitle, description: "" });
    setEditingTopicId(null);
    setEditingTopicTitle("");
    refetchTopics();
  };

  // Session CRUD handlers
  const handleCreateSession = async (topicId: number) => {
    if (!quickAddSessionTitle.trim()) return;
    const { createSession } = await import("@/lib/api/sessions");
    await createSession(matkulId, {
      title: quickAddSessionTitle,
      description: "",
      number: 0,
    });
    setQuickAddSessionTitle("");
    setShowQuickAddSession(null);
    refetchTopics();
  };

  const handleDeleteSession = async (sessionId: number) => {
    await confirm({
      title: "Hapus Sesi?",
      description: "Sesi dan materi di dalamnya akan dihapus.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        const { deleteSession } = await import("@/lib/api/sessions");
        await deleteSession(sessionId);
        refetchTopics();
      },
    });
  };

  if (loading) {
    return <MatkulDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Mata kuliah tidak ditemukan</p>
        <Button variant="link" asChild>
          <Link href="/akademik">Kembali ke Akademik</Link>
        </Button>
      </div>
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/akademik" className="hover:text-primary">Akademik</Link>
        <span>›</span>
        <span className="text-foreground">{course.name}</span>
      </div>

      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/akademik">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </Button>

      {/* Course header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{course.code}</Badge>
              <Badge variant="secondary">{course.sks} SKS</Badge>
              {course.cawu_id && <Badge>Cawu {course.cawu_id}</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            {course.description && (
              <p className="text-muted-foreground mt-1">{course.description}</p>
            )}
            {course.instructors && course.instructors.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Dosen: {course.instructors.join(", ")}
              </p>
            )}
          </div>
          {/* Kurikulum controls */}
          {isKurikulum && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materi" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Materi
          </TabsTrigger>
          <TabsTrigger value="tugas" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tugas
          </TabsTrigger>
          <TabsTrigger value="bank-soal" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Bank Soal
          </TabsTrigger>
          <TabsTrigger value="nilai" className="gap-2">
            <Calculator className="h-4 w-4" />
            Nilai
          </TabsTrigger>
        </TabsList>

        {/* Materi Tab */}
        <TabsContent value="materi" className="mt-4">
          {/* Topics List */}
          {topics.length === 0 ? (
            <EmptyState icon={BookOpen} message="Belum ada topik tersedia" />
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {topics.map((topic) => (
                <AccordionItem
                  key={topic.id}
                  value={`topic-${topic.id}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-3">
                    <div className="flex items-center gap-2 w-full pr-4">
                      <BookOpen className="h-5 w-5 flex-shrink-0" />
                      {editingTopicId === topic.id ? (
                        <Input
                          className="h-8 flex-1"
                          value={editingTopicTitle}
                          onChange={(e) => setEditingTopicTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdateTopic(topic.id)}
                          autoFocus
                        />
                      ) : (
                        <CardTitle className="text-lg flex-1">{topic.title}</CardTitle>
                      )}
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {topic.sessions?.length || 0} sesi
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">
                        {topic.description || "Tidak ada deskripsi"}
                      </p>
                      {isKurikulum && (
                        <div className="flex gap-1">
                          {editingTopicId === topic.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateTopic(topic.id)}>Simpan</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingTopicId(null); setEditingTopicTitle(""); }}>Batal</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingTopicId(topic.id); setEditingTopicTitle(topic.title); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sessions inside topic */}
                    {!topic.sessions || topic.sessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground mb-3">
                        Belum ada sesi untuk topik ini
                      </p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {topic.sessions.map((session, index) => (
                          <div key={session.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                            <Link
                              href={`/akademik/${matkulId}/sesi/${session.id}`}
                              className="flex items-center gap-2 flex-1"
                            >
                              <Badge variant="outline" className="text-xs shrink-0">
                                Sesi {session.number > 0 ? session.number : index + 1}
                              </Badge>
                              <span className="font-medium text-sm">{session.title}</span>
                            </Link>
                            {isKurikulum && (
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSession(session.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Session */}
                    {isKurikulum && (
                      !showQuickAddSession || showQuickAddSession === topic.id ? (
                        <div className="flex gap-2">
                          {showQuickAddSession === topic.id ? (
                            <>
                              <Input
                                placeholder="Nama sesi..."
                                value={quickAddSessionTitle}
                                onChange={(e) => setQuickAddSessionTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateSession(topic.id)}
                                className="h-8"
                              />
                              <Button size="sm" onClick={() => handleCreateSession(topic.id)}>Simpan</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setShowQuickAddSession(null); setQuickAddSessionTitle(""); }}>Batal</Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setShowQuickAddSession(topic.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Tambah Sesi
                            </Button>
                          )}
                        </div>
                      ) : null
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        {/* Tugas Tab */}
        <TabsContent value="tugas" className="mt-4">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              message="Belum ada tugas untuk matkul ini"
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isCompleted = task.progress?.completed;
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center gap-3 w-full text-left rounded-lg border p-4 hover:bg-accent transition-colors"
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
                        className="mr-2"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Monitoring
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge variant="success" className="text-xs">
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Komponen Penilaian
                </CardTitle>
                {isKurikulum && (
                  <Button size="sm" onClick={() => setShowAddComponent(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Komponen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Component Form */}
              {showAddComponent && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nama komponen (e.g. UTS)"
                      value={newComponentName}
                      onChange={(e) => setNewComponentName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Bobot %"
                      value={newComponentWeight}
                      onChange={(e) => setNewComponentWeight(e.target.value)}
                      className="w-24"
                    />
                    <Button onClick={handleAddComponent} disabled={!newComponentName || !newComponentWeight}>
                      Simpan
                    </Button>
                    <Button variant="outline" onClick={() => { setShowAddComponent(false); setNewComponentName(""); setNewComponentWeight(""); }}>
                      Batal
                    </Button>
                  </div>
                </div>
              )}

              {gradeComponents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada komponen penilaian untuk mata kuliah ini
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {gradeComponents.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{comp.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Bobot: {comp.weight}%
                          </div>
                        </div>
                        {isKurikulum && (
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteComponent(comp.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <div className="text-right">
                          <div className="text-lg font-semibold">
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
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Bobot</div>
                        <div className="text-lg font-semibold">
                          {gradeComponents.reduce((sum, c) => sum + c.weight, 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Nilai Akhir</div>
                        <div className="text-2xl font-bold text-primary">
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggleComplete={handleToggleTask}
        />
      )}

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
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function MatkulDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
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
  );
}
