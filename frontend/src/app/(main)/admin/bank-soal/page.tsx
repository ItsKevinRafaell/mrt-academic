"use client";

import { useEffect, useState } from "react";
import { RouteGuard } from "@/components/RouteGuard";
import { FileText, Clock, Play, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDFViewer } from "@/components/pdf-viewer";
import { CBTSimulator } from "@/components/cbt-simulator";
import {
  getExamArchives,
  createExamArchive,
  updateExamArchive,
  deleteExamArchive,
  getSimulations,
  getSimulation,
  createSimulation,
  updateSimulation,
  deleteSimulation,
} from "@/lib/api/bank-soal";
import type { ExamArchive, Simulation, ExamType, CreateExamArchiveRequest, CreateSimulationRequest } from "@/types/bank-soal";
import type { Course } from "@/types";
import { getCourses } from "@/lib/api/courses";

export default function BankSoalPage() {
  const [archives, setArchives] = useState<ExamArchive[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddArchive, setShowAddArchive] = useState(false);
  const [showAddSimulation, setShowAddSimulation] = useState(false);
  const [editingArchive, setEditingArchive] = useState<ExamArchive | null>(null);
  const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null);

  const [archiveForm, setArchiveForm] = useState<CreateExamArchiveRequest>({
    course_id: 0,
    title: "",
    description: "",
    exam_type: "uts" as ExamType,
    year: 2024,
    file_url: "",
    file_type: "pdf",
  });

  const [simulationForm, setSimulationForm] = useState<CreateSimulationRequest>({
    course_id: 0,
    title: "",
    description: "",
    duration_minutes: 90,
  });

  const [viewingPDF, setViewingPDF] = useState<{ url: string; title: string } | null>(null);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadData(selectedCourseId);
    }
  }, [selectedCourseId]);

  async function loadCourses() {
    setLoading(true);
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadData(courseId: number) {
    setLoading(true);
    try {
      const [archivesData, simulationsData] = await Promise.all([
        getExamArchives(courseId),
        getSimulations(courseId),
      ]);
      setArchives(archivesData || []);
      setSimulations(simulationsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);

      // Inject dummy data if API fails
      if (courseId === 1) {
        setArchives([
          {
            id: 1,
            course_id: 1,
            title: "UTS Algoritma & Pemrograman 2024",
            description: "Soal UTS semester ganjil covering sorting, searching, dan data structures",
            exam_type: "uts",
            year: 2024,
            file_url: "/dummy/uts-algo-2024.pdf",
            file_type: "pdf",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
          },
          {
            id: 2,
            course_id: 1,
            title: "UAS Algoritma & Pemrograman 2023",
            description: "Soal UAS comprehensive dari dynamic programming hingga graph algorithms",
            exam_type: "uas",
            year: 2023,
            file_url: "/dummy/uas-algo-2023.pdf",
            file_type: "pdf",
            created_at: "2023-06-20T10:00:00Z",
            updated_at: "2023-06-20T10:00:00Z",
          },
        ]);

        setSimulations([
          {
            id: 1,
            course_id: 1,
            title: "Latihan UTS: Sorting Algorithms",
            description: "Simulasi 60 menit fokus pada bubble sort, quick sort, merge sort, dan analisis kompleksitas",
            duration_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            course_id: 1,
            title: "Tryout UAS: Graph & Tree Traversal",
            description: "Simulasi ujian akhir dengan BFS, DFS, shortest path, dan minimum spanning tree",
            duration_minutes: 90,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 3,
            course_id: 1,
            title: "Kuis Harian: Recursion & Dynamic Programming",
            description: "Kuis singkat 30 menit untuk memahami konsep rekursi dan DP",
            duration_minutes: 30,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else if (courseId === 2) {
        setSimulations([
          {
            id: 4,
            course_id: 2,
            title: "Latihan SQL: JOIN & Subqueries",
            description: "Simulasi 45 menit untuk praktik INNER JOIN, LEFT JOIN, dan subqueries kompleks",
            duration_minutes: 45,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 5,
            course_id: 2,
            title: "Tryout Normalisasi Database",
            description: "Ujian praktik normalisasi 1NF, 2NF, 3NF, dan BCNF dengan studi kasus",
            duration_minutes: 75,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else {
        setArchives([]);
        setSimulations([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAddArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArchive) {
        await updateExamArchive(editingArchive.id, archiveForm);
      } else {
        await createExamArchive(archiveForm);
      }
      setShowAddArchive(false);
      setEditingArchive(null);
      resetArchiveForm();
      if (selectedCourseId) loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to save archive:", error);
    }
  };

  const handleAddSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSimulation) {
        await updateSimulation(editingSimulation.id, simulationForm);
      } else {
        await createSimulation(simulationForm);
      }
      setShowAddSimulation(false);
      setEditingSimulation(null);
      resetSimulationForm();
      if (selectedCourseId) loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to save simulation:", error);
    }
  };

  const handleDeleteArchive = async (id: number) => {
    if (!confirm("Yakin ingin menghapus arsip ini?")) return;
    try {
      await deleteExamArchive(id);
      if (selectedCourseId) loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to delete archive:", error);
    }
  };

  const handleDeleteSimulation = async (id: number) => {
    if (!confirm("Yakin ingin menghapus simulasi ini?")) return;
    try {
      await deleteSimulation(id);
      if (selectedCourseId) loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to delete simulation:", error);
    }
  };

  const handleStartSimulation = async (simulationId: number) => {
    try {
      const simulation = await getSimulation(simulationId);
      setActiveSimulation(simulation);
    } catch (error) {
      console.error("Failed to start simulation:", error);
    }
  };

  const handleSimulationComplete = () => {
    setActiveSimulation(null);
    if (selectedCourseId) loadData(selectedCourseId);
  };

  function resetArchiveForm() {
    setArchiveForm({
      course_id: selectedCourseId || 0,
      title: "",
      description: "",
      exam_type: "uts",
      year: 2024,
      file_url: "",
      file_type: "pdf",
    });
  }

  function resetSimulationForm() {
    setSimulationForm({
      course_id: selectedCourseId || 0,
      title: "",
      description: "",
      duration_minutes: 90,
    });
  }

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown";
  };

  const getCourseCode = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.code : "N/A";
  };

  if (activeSimulation) {
    return <CBTSimulator simulation={activeSimulation} onComplete={handleSimulationComplete} />;
  }

  if (viewingPDF) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setViewingPDF(null)}>
          ← Kembali
        </Button>
        <PDFViewer url={viewingPDF.url} title={viewingPDF.title} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const filteredArchives = archives.filter(
    (archive) =>
      archive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.exam_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSimulations = simulations.filter((sim) =>
    sim.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RouteGuard allowedRoles={["KURIKULUM", "SUPER_ADMIN"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bank Soal & Simulasi</h1>
            <p className="text-muted-foreground">Arsip soal ujian dan simulasi CBT</p>
          </div>
        </div>

      <div className="flex items-center gap-4">
        <Label className="whitespace-nowrap">Mata Kuliah:</Label>
        <Select
          value={selectedCourseId?.toString() || ""}
          onValueChange={(val) => setSelectedCourseId(parseInt(val))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Pilih mata kuliah" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.code} — {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="arsip">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="arsip" className="gap-2">
            <FileText className="h-4 w-4" />
            Arsip Ujian
          </TabsTrigger>
          <TabsTrigger value="simulasi" className="gap-2">
            <Play className="h-4 w-4" />
            Simulasi CBT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arsip" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Cari arsip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button
              onClick={() => {
                resetArchiveForm();
                setShowAddArchive(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Arsip
            </Button>
          </div>

          <div className="space-y-4">
            {filteredArchives.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum ada arsip ujian untuk mata kuliah ini
                </CardContent>
              </Card>
            ) : (
              filteredArchives.map((archive) => (
                <Card key={archive.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4" />
                          <h4 className="font-semibold">{archive.title}</h4>
                          <Badge variant="outline">{archive.exam_type.toUpperCase()}</Badge>
                          <Badge variant="outline">{archive.year}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getCourseName(archive.course_id)} • {getCourseCode(archive.course_id)}
                        </p>
                        {archive.description && (
                          <p className="text-sm text-muted-foreground mt-2">{archive.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPDF({ url: archive.file_url, title: archive.title })}
                        >
                          Buka PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingArchive(archive);
                            setArchiveForm({
                              course_id: archive.course_id,
                              title: archive.title,
                              description: archive.description || "",
                              exam_type: archive.exam_type,
                              year: archive.year,
                              file_url: archive.file_url,
                              file_type: archive.file_type || "pdf",
                            });
                            setShowAddArchive(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteArchive(archive.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="simulasi" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Cari simulasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button
              onClick={() => {
                resetSimulationForm();
                setShowAddSimulation(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Simulasi
            </Button>
          </div>

          <div className="space-y-4">
            {filteredSimulations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum ada simulasi CBT untuk mata kuliah ini
                </CardContent>
              </Card>
            ) : (
              filteredSimulations.map((simulation) => (
                <Card key={simulation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{simulation.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getCourseName(simulation.course_id)} • {getCourseCode(simulation.course_id)}
                        </p>
                        {simulation.description && (
                          <p className="text-sm text-muted-foreground mt-2">{simulation.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{simulation.duration_minutes} menit</span>
                          </div>
                          <Badge variant="outline">{simulation.questions?.length || 0} soal</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartSimulation(simulation.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Mulai
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSimulation(simulation);
                            setSimulationForm({
                              course_id: simulation.course_id,
                              title: simulation.title,
                              description: simulation.description || "",
                              duration_minutes: simulation.duration_minutes,
                            });
                            setShowAddSimulation(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSimulation(simulation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Archive Dialog */}
      <Dialog open={showAddArchive} onOpenChange={setShowAddArchive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArchive ? "Edit Arsip Ujian" : "Tambah Arsip Ujian"}</DialogTitle>
            <DialogDescription>
              {editingArchive ? "Edit informasi arsip ujian" : "Tambah arsip ujian baru ke bank soal"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddArchive} className="space-y-4">
            <div>
              <Label>Mata Kuliah</Label>
              <Select
                value={archiveForm.course_id.toString()}
                onValueChange={(val) => setArchiveForm({ ...archiveForm, course_id: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jenis Ujian</Label>
              <Select
                value={archiveForm.exam_type}
                onValueChange={(val) => setArchiveForm({ ...archiveForm, exam_type: val as ExamType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis ujian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kuis">Kuis</SelectItem>
                  <SelectItem value="uts">UTS</SelectItem>
                  <SelectItem value="uas">UAS</SelectItem>
                  <SelectItem value="tryout">Try Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahun</Label>
              <Input
                type="number"
                min="2020"
                max="2030"
                value={archiveForm.year}
                onChange={(e) => setArchiveForm({ ...archiveForm, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Judul</Label>
              <Input
                placeholder="UTS Pemrograman Web 2024"
                value={archiveForm.title}
                onChange={(e) => setArchiveForm({ ...archiveForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>URL File PDF</Label>
              <Input
                placeholder="/uploads/exams/file.pdf"
                value={archiveForm.file_url}
                onChange={(e) => setArchiveForm({ ...archiveForm, file_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi arsip..."
                value={archiveForm.description}
                onChange={(e) => setArchiveForm({ ...archiveForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddArchive(false)}>
                Batal
              </Button>
              <Button type="submit">{editingArchive ? "Perbarui" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Simulation Dialog */}
      <Dialog open={showAddSimulation} onOpenChange={setShowAddSimulation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSimulation ? "Edit Simulasi CBT" : "Buat Simulasi CBT"}</DialogTitle>
            <DialogDescription>
              {editingSimulation ? "Edit simulasi CBT" : "Buat simulasi CBT baru untuk latihan ujian"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSimulation} className="space-y-4">
            <div>
              <Label>Judul Simulasi</Label>
              <Input
                placeholder="Simulasi UTS Pemrograman Web"
                value={simulationForm.title}
                onChange={(e) => setSimulationForm({ ...simulationForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Mata Kuliah</Label>
              <Select
                value={simulationForm.course_id.toString()}
                onValueChange={(val) => setSimulationForm({ ...simulationForm, course_id: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                min="10"
                max="180"
                value={simulationForm.duration_minutes}
                onChange={(e) =>
                  setSimulationForm({ ...simulationForm, duration_minutes: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi simulasi..."
                value={simulationForm.description}
                onChange={(e) => setSimulationForm({ ...simulationForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSimulation(false)}>
                Batal
              </Button>
              <Button type="submit">{editingSimulation ? "Perbarui" : "Buat Simulasi"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </RouteGuard>
  );
}
