"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, Play, Search, ExternalLink, Plus, Link2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CBTSimulator } from "@/components/cbt-simulator";
import { getExamArchives, getSimulations, getSimulation, createExamArchive, createSimulation, deleteExamArchive, deleteSimulation } from "@/lib/api/bank-soal";
import type { ExamArchive, Simulation, ExamType } from "@/types/bank-soal";
import type { Course } from "@/types";
import { getCourses } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";

export default function BankSoalPage() {
  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);

  const [archives, setArchives] = useState<ExamArchive[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);

  // Dialog states
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showQuickLinkDialog, setShowQuickLinkDialog] = useState(false);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [archiveForm, setArchiveForm] = useState<{ title: string; description: string; exam_type: ExamType; year: number; file_url: string }>({ title: "", description: "", exam_type: "uts", year: new Date().getFullYear(), file_url: "" });
  const [quickLinkForm, setQuickLinkForm] = useState<{ title: string; url: string }>({ title: "", url: "" });
  const [simulationForm, setSimulationForm] = useState({ title: "", description: "", duration_minutes: 60 });

  const handleExamTypeChange = (v: string) => {
    setArchiveForm(prev => ({ ...prev, exam_type: v as ExamType }));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadData(selectedCourseId);
  }, [selectedCourseId]);

  async function loadCourses() {
    setLoading(true);
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id);
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
    } finally {
      setLoading(false);
    }
  }

  const handleCreateArchive = async () => {
    if (!selectedCourseId) return;
    try {
      await createExamArchive({ ...archiveForm, course_id: selectedCourseId });
      setShowArchiveDialog(false);
      setArchiveForm({ title: "", description: "", exam_type: "uts", year: new Date().getFullYear(), file_url: "" });
      loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to create archive:", error);
    }
  };

  const handleCreateQuickLink = async () => {
    if (!selectedCourseId || !quickLinkForm.title || !quickLinkForm.url) return;
    try {
      await createExamArchive({
        course_id: selectedCourseId,
        title: quickLinkForm.title,
        description: "",
        exam_type: "kuis",
        year: new Date().getFullYear(),
        file_url: quickLinkForm.url,
        file_type: "link",
      });
      setShowQuickLinkDialog(false);
      setQuickLinkForm({ title: "", url: "" });
      loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to create quick link:", error);
    }
  };

  const handleDeleteArchive = async (id: number) => {
    if (!confirm("Hapus arsip ini?")) return;
    try {
      await deleteExamArchive(id);
      loadData(selectedCourseId!);
    } catch (error) {
      console.error("Failed to delete archive:", error);
    }
  };

  const handleDeleteSimulation = async (id: number) => {
    if (!confirm("Hapus simulasi ini?")) return;
    try {
      await deleteSimulation(id);
      loadData(selectedCourseId!);
    } catch (error) {
      console.error("Failed to delete simulation:", error);
    }
  };

  const handleCreateSimulation = async () => {
    if (!selectedCourseId) return;
    try {
      await createSimulation({ ...simulationForm, course_id: selectedCourseId });
      setShowSimulationDialog(false);
      setSimulationForm({ title: "", description: "", duration_minutes: 60 });
      loadData(selectedCourseId);
    } catch (error) {
      console.error("Failed to create simulation:", error);
    }
  };

  const filteredArchives = archives.filter(
    (a) => a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSimulations = simulations.filter(
    (s) => s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeSimulation) {
    return <CBTSimulator simulation={activeSimulation} onComplete={() => { setActiveSimulation(null); if (selectedCourseId) loadData(selectedCourseId); }} />;
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Soal</h1>
          <p className="text-muted-foreground">Arsip ujian dan simulasi kuis</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label>Mata Kuliah:</Label>
        <Select value={selectedCourseId?.toString() || ""} onValueChange={(v) => setSelectedCourseId(parseInt(v))}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="arsip">
        <TabsList>
          <TabsTrigger value="arsip"><FileText className="h-4 w-4 mr-2" />Arsip</TabsTrigger>
          <TabsTrigger value="simulasi"><Play className="h-4 w-4 mr-2" />Simulasi</TabsTrigger>
        </TabsList>

        <TabsContent value="arsip" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            {isKurikulum && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowQuickLinkDialog(true)}>
                  <Link2 className="h-4 w-4 mr-2" />Link Cepat
                </Button>
                <Button size="sm" onClick={() => setShowArchiveDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />Tambah Arsip
                </Button>
              </div>
            )}
          </div>

          {filteredArchives.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada arsip</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredArchives.map((archive) => (
                <Card key={archive.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {archive.file_type === "link" ? (
                        <Link2 className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{archive.title}</p>
                        <p className="text-xs text-muted-foreground">{archive.exam_type} {archive.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{archive.file_type === "link" ? "LINK" : archive.file_type || "PDF"}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={archive.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />Buka
                        </a>
                      </Button>
                      {isKurikulum && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteArchive(archive.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulasi" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            {isKurikulum && (
              <Button size="sm" onClick={() => setShowSimulationDialog(true)}><Plus className="h-4 w-4 mr-2" />Buat Simulasi</Button>
            )}
          </div>

          {filteredSimulations.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada simulasi</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSimulations.map((sim) => (
                <Card key={sim.id} className="hover:shadow-md transition-shadow relative">
                  <CardContent className="pt-4">
                    {isKurikulum && (
                      <Button
                        variant="ghost" size="sm"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => handleDeleteSimulation(sim.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <h3 className="font-semibold">{sim.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{sim.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.duration_minutes} menit</span>
                      <span>{sim.questions?.length || 0} soal</span>
                    </div>
                    <Button className="w-full mt-4" size="sm" onClick={() => getSimulation(sim.id).then(setActiveSimulation)}>
                      <Play className="h-4 w-4 mr-2" />Mulai
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Link Dialog */}
      <Dialog open={showQuickLinkDialog} onOpenChange={setShowQuickLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Tambah Link Cepat</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Simpan judul dan link (Google Drive, Dropbox, dll)</p>
          <div className="space-y-4">
            <div><Label>Judul</Label><Input value={quickLinkForm.title} onChange={(e) => setQuickLinkForm({ ...quickLinkForm, title: e.target.value })} placeholder="UTS 2024 - Google Drive" /></div>
            <div><Label>URL</Label><Input value={quickLinkForm.url} onChange={(e) => setQuickLinkForm({ ...quickLinkForm, url: e.target.value })} placeholder="https://drive.google.com/..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickLinkDialog(false)}>Batal</Button>
            <Button onClick={handleCreateQuickLink}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Archive Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Arsip</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Judul</Label><Input value={archiveForm.title} onChange={(e) => setArchiveForm({ ...archiveForm, title: e.target.value })} placeholder="UTS Ganjil 2024" /></div>
            <div><Label>Deskripsi</Label><Input value={archiveForm.description} onChange={(e) => setArchiveForm({ ...archiveForm, description: e.target.value })} /></div>
            <div className="flex gap-4">
              <div className="flex-1"><Label>Jenis</Label><Select value={archiveForm.exam_type} onValueChange={handleExamTypeChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="uts">UTS</SelectItem><SelectItem value="uas">UAS</SelectItem><SelectItem value="kuis">Quiz</SelectItem><SelectItem value="tryout">Tryout</SelectItem></SelectContent></Select></div>
              <div className="flex-1"><Label>Tahun</Label><Input type="number" value={archiveForm.year} onChange={(e) => setArchiveForm({ ...archiveForm, year: parseInt(e.target.value) })} /></div>
            </div>
            <div><Label>Link File</Label><Input value={archiveForm.file_url} onChange={(e) => setArchiveForm({ ...archiveForm, file_url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>Batal</Button>
            <Button onClick={handleCreateArchive}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Simulation Dialog */}
      <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Simulasi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Judul</Label><Input value={simulationForm.title} onChange={(e) => setSimulationForm({ ...simulationForm, title: e.target.value })} placeholder="Simulasi UTS" /></div>
            <div><Label>Deskripsi</Label><Input value={simulationForm.description} onChange={(e) => setSimulationForm({ ...simulationForm, description: e.target.value })} /></div>
            <div><Label>Durasi (menit)</Label><Input type="number" value={simulationForm.duration_minutes} onChange={(e) => setSimulationForm({ ...simulationForm, duration_minutes: parseInt(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimulationDialog(false)}>Batal</Button>
            <Button onClick={handleCreateSimulation}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
