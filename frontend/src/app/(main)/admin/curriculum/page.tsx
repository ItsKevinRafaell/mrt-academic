"use client";

import { useEffect, useState } from "react";
import { RouteGuard } from "@/components/RouteGuard";
import { BookOpen, Calendar, FileText, Tags, Upload, Download, ChevronRight, Pencil, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getCourses } from "@/lib/api/courses";
import { getSessions } from "@/lib/api/sessions";
import { getMaterialsByCourse } from "@/lib/api/materials";
import { exportCourses, exportTemplate } from "@/lib/api/excel";
import type { Course, Session, Material } from "@/types";
import { CourseDialog } from "./components/CourseDialog";
import { SessionDialog } from "./components/SessionDialog";
import { MaterialDialog } from "./components/MaterialDialog";
import { TopicManagementDialog } from "@/components/admin/TopicManagementDialog";
import { ExcelImportDialog } from "@/components/admin/ExcelImportDialog";
import { GradeComponentManagementDialog } from "@/components/admin/GradeComponentManagementDialog";

type ViewMode = "courses" | "course-detail" | "session-detail";

export default function CurriculumPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>("courses");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);

      const [sessionsData, materialsData] = await Promise.all([
        Promise.all(coursesData.map(c => getSessions(c.id))).then(s => s.flat()),
        Promise.all(coursesData.map(c => getMaterialsByCourse(c.id))).then(m => m.flat()),
      ]);

      setSessions(sessionsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setViewMode("course-detail");
  };

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setViewMode("session-detail");
  };

  const handleBackToCourses = () => {
    setViewMode("courses");
    setSelectedCourse(null);
    setSelectedSession(null);
  };

  const handleBackToCourse = () => {
    setViewMode("course-detail");
    setSelectedSession(null);
  };

  async function handleExport() {
    setExporting(true);
    try {
      await exportCourses();
    } catch {
      alert("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      await exportTemplate();
    } catch {
      alert("Gagal mengunduh template");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const courseSessions = selectedCourse
    ? sessions.filter(s => s.course_id === selectedCourse.id)
    : [];

  const sessionMaterials = selectedSession
    ? materials.filter(m => m.session_id === selectedSession.id)
    : [];

  return (
    <RouteGuard allowedRoles={["KURIKULUM", "SUPER_ADMIN"]}>
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Akademik</h1>
          <p className="text-muted-foreground">
            Kelola mata kuliah, sesi, materi, dan topik
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting || courses.length === 0} size="sm">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)} size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={handleBackToCourses}
          className={`flex items-center gap-1 hover:text-primary transition-colors ${
            viewMode === "courses" ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Mata Kuliah
        </button>

        {selectedCourse && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={handleBackToCourse}
              className={`flex items-center gap-1 hover:text-primary transition-colors ${
                viewMode === "course-detail" ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {selectedCourse.code}
            </button>
          </>
        )}

        {selectedSession && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-primary font-semibold">
              {selectedSession.title}
            </span>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <Card>
        <CardContent className="p-6">
          {/* Courses View */}
          {viewMode === "courses" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Daftar Mata Kuliah</h2>
                <Button onClick={() => {
                  setEditingCourse(null);
                  setShowCourseDialog(true);
                }}>
                  Tambah Mata Kuliah
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{course.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{course.code}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {course.sks} SKS
                          </p>
                          {course.instructors && course.instructors.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {course.instructors.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCourse(course);
                              setShowCourseDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Course Detail View */}
          {viewMode === "course-detail" && selectedCourse && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToCourses}
                    className="mb-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <h2 className="text-2xl font-bold">{selectedCourse.name}</h2>
                  <p className="text-muted-foreground mt-1">{selectedCourse.code} • {selectedCourse.sks} SKS</p>
                  {selectedCourse.instructors && selectedCourse.instructors.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Dosen: {selectedCourse.instructors.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCourse(selectedCourse);
                      setShowCourseDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSessionDialog(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Tambah Sesi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTopicDialog(true)}
                  >
                    <Tags className="h-4 w-4 mr-2" />
                    Kelola Topik
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGradeDialog(true)}
                  >
                    Komposisi Nilai
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Daftar Sesi ({courseSessions.length})</h3>
                <div className="space-y-3">
                  {courseSessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Belum ada sesi untuk mata kuliah ini
                      </CardContent>
                    </Card>
                  ) : (
                    courseSessions.map((session) => {
                      const sessionMats = materials.filter(m => m.session_id === session.id);
                      return (
                        <Card
                          key={session.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleSessionSelect(session)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{session.title}</h4>
                                {session.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {session.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {sessionMats.length} materi
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Session Detail View */}
          {viewMode === "session-detail" && selectedSession && selectedCourse && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToCourse}
                    className="mb-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <h2 className="text-2xl font-bold">{selectedSession.title}</h2>
                  <p className="text-muted-foreground mt-1">
                    {selectedCourse.name} • {selectedCourse.code}
                  </p>
                  {selectedSession.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedSession.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMaterialDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Tambah Materi
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Materi ({sessionMaterials.length})</h3>
                <div className="space-y-3">
                  {sessionMaterials.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Belum ada materi untuk sesi ini
                      </CardContent>
                    </Card>
                  ) : (
                    sessionMaterials.map((material) => (
                      <Card key={material.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{material.title}</h4>
                              {material.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{material.type}</Badge>
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Buka Materi
                                </a>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit material logic
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CourseDialog
        open={showCourseDialog}
        onOpenChange={setShowCourseDialog}
        course={editingCourse}
        onSaved={() => {
          setShowCourseDialog(false);
          loadData();
        }}
      />

      <SessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        courses={selectedCourse ? [selectedCourse] : courses}
        onSaved={() => {
          setShowSessionDialog(false);
          loadData();
        }}
      />

      <MaterialDialog
        open={showMaterialDialog}
        onOpenChange={setShowMaterialDialog}
        courses={selectedCourse ? [selectedCourse] : courses}
        sessions={selectedCourse ? courseSessions : sessions}
        onSaved={() => {
          setShowMaterialDialog(false);
          loadData();
        }}
      />

      <TopicManagementDialog
        open={showTopicDialog}
        onOpenChange={setShowTopicDialog}
        courses={selectedCourse ? [selectedCourse] : courses}
        initialCourse={selectedCourse}
      />

      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImported={() => {
          setShowImportDialog(false);
          loadData();
        }}
      />

      {selectedCourse && (
        <GradeComponentManagementDialog
          open={showGradeDialog}
          onOpenChange={setShowGradeDialog}
          course={selectedCourse}
        />
      )}
    </div>
    </RouteGuard>
  );
}
