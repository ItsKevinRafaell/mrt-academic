"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Video,
  Link as LinkIcon,
  Camera,
  Calendar,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";

interface Course {
  id: number;
  code: string;
  name: string;
  description?: string;
  sks: number;
}

interface Topic {
  id: number;
  title: string;
  description?: string;
}

interface Session {
  id: number;
  title: string;
  number: number;
}

interface Material {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string;
}

export default function KelolaCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit course dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    description: "",
    sks: 3,
  });

  // Add topic dialog
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: "", description: "" });

  // Add session dialog
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", number: 1 });

  // Add material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    type: "pdf",
    url: "",
    description: "",
    topic_id: 0,
  });

  // Grade components state
  const [gradeComponents, setGradeComponents] = useState<any[]>([]);
  const [gradeComponentDialogOpen, setGradeComponentDialogOpen] = useState(false);
  const [gradeComponentForm, setGradeComponentForm] = useState({
    name: "",
    weight: 0,
  });
  const [editingGradeComponentId, setEditingGradeComponentId] = useState<number | null>(null);

  useEffect(() => {
    if (!courseId) return;
    fetchData();
  }, [courseId]);

  async function fetchData() {
    try {
      const [courseRes, topicsRes, sessionsRes, materialsRes, gradeComponentsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/topics`),
        api.get(`/courses/${courseId}/sessions`),
        api.get(`/courses/${courseId}/materials`),
        api.get(`/courses/${courseId}/grade-components`),
      ]);

      setCourse(courseRes.data.data);
      setTopics(topicsRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
      setMaterials(materialsRes.data.data || []);
      setGradeComponents(gradeComponentsRes.data.data || []);

      setEditForm({
        code: courseRes.data.data.code,
        name: courseRes.data.data.name,
        description: courseRes.data.data.description || "",
        sks: courseRes.data.data.sks,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCourse() {
    try {
      await api.put(`/courses/${courseId}`, editForm);
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to update course:", error);
      alert("Gagal memperbarui mata kuliah");
    }
  }

  async function handleAddTopic() {
    try {
      await api.post(`/courses/${courseId}/topics`, topicForm);
      setTopicDialogOpen(false);
      setTopicForm({ title: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to add topic:", error);
      alert("Gagal menambah topik");
    }
  }

  async function handleDeleteTopic(topicId: number) {
    if (!confirm("Yakin ingin menghapus topik ini?")) return;
    try {
      await api.delete(`/topics/${topicId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete topic:", error);
      alert("Gagal menghapus topik");
    }
  }

  async function handleAddSession() {
    try {
      await api.post(`/courses/${courseId}/sessions`, sessionForm);
      setSessionDialogOpen(false);
      setSessionForm({ title: "", number: 1 });
      fetchData();
    } catch (error) {
      console.error("Failed to add session:", error);
      alert("Gagal menambah sesi");
    }
  }

  async function handleDeleteSession(sessionId: number) {
    if (!confirm("Yakin ingin menghapus sesi ini?")) return;
    try {
      await api.delete(`/sessions/${sessionId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert("Gagal menghapus sesi");
    }
  }

  async function handleAddMaterial() {
    try {
      await api.post(`/materials`, {
        ...materialForm,
        topic_id: materialForm.topic_id || null,
      });
      setMaterialDialogOpen(false);
      setMaterialForm({
        title: "",
        type: "pdf",
        url: "",
        description: "",
        topic_id: 0,
      });
      fetchData();
    } catch (error) {
      console.error("Failed to add material:", error);
      alert("Gagal menambah materi");
    }
  }

  async function handleDeleteMaterial(materialId: number) {
    if (!confirm("Yakin ingin menghapus materi ini?")) return;
    try {
      await api.delete(`/materials/${materialId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete material:", error);
      alert("Gagal menghapus materi");
    }
  }

  // Grade component handlers
  async function handleAddGradeComponent() {
    try {
      if (editingGradeComponentId) {
        await api.put(`/grade-components/${editingGradeComponentId}`, gradeComponentForm);
      } else {
        await api.post(`/courses/${courseId}/grade-components`, gradeComponentForm);
      }
      setGradeComponentDialogOpen(false);
      setGradeComponentForm({ name: "", weight: 0 });
      setEditingGradeComponentId(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save grade component:", error);
      alert("Gagal menyimpan komponen nilai");
    }
  }

  async function handleEditGradeComponent(component: any) {
    setGradeComponentForm({ name: component.name, weight: component.weight });
    setEditingGradeComponentId(component.id);
    setGradeComponentDialogOpen(true);
  }

  async function handleDeleteGradeComponent(componentId: number) {
    if (!confirm("Yakin ingin menghapus komponen nilai ini?")) return;
    try {
      await api.delete(`/grade-components/${componentId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete grade component:", error);
      alert("Gagal menghapus komponen nilai");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Mata kuliah tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kelola: {course.name}</h1>
            <p className="text-muted-foreground mt-1">
              {course.code} • {course.sks} SKS
            </p>
          </div>
          <Button onClick={() => setEditDialogOpen(true)} variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Info
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="topics">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="topics">
            Topik ({topics.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sesi ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="materials">
            Materi ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="nilai">
            Nilai ({gradeComponents.length})
          </TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Topik</h2>
            <Button onClick={() => setTopicDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Topik
            </Button>
          </div>

          {topics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Belum ada topik</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {topic.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/akademik/${courseId}/topik/${topic.id}`)}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTopic(topic.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sesi</h2>
            <Button onClick={() => setSessionDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Sesi
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Belum ada sesi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {session.number}
                        </div>
                        <h3 className="font-medium">{session.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materi</h2>
            <Button onClick={() => setMaterialDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Materi
            </Button>
          </div>

          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Belum ada materi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {material.type === "pdf" && (
                            <FileText className="h-5 w-5 text-red-500" />
                          )}
                          {material.type === "video" && (
                            <Video className="h-5 w-5 text-primary" />
                          )}
                          {material.type === "link" && (
                            <LinkIcon className="h-5 w-5 text-green-500" />
                          )}
                          {!["pdf", "video", "link"].includes(material.type) && (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {material.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {material.type?.toUpperCase() || 'UNKNOWN'} • {material.url}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Grade Components Tab */}
        <TabsContent value="nilai" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Komponen Nilai</h2>
            <Button
              onClick={() => {
                setGradeComponentForm({ name: "", weight: 0 });
                setEditingGradeComponentId(null);
                setGradeComponentDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Komponen
            </Button>
          </div>

          {gradeComponents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Belum ada komponen nilai</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {gradeComponents.map((component) => (
                <Card key={component.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{component.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Bobot: {component.weight}%
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditGradeComponent(component)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGradeComponent(component.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Total bobot:{" "}
                  <span className={gradeComponents.reduce((sum, c) => sum + c.weight, 0) === 100 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {gradeComponents.reduce((sum, c) => sum + c.weight, 0)}%
                  </span>
                  {gradeComponents.reduce((sum, c) => sum + c.weight, 0) !== 100 && (
                    <span className="ml-2">(harus 100%)</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mata Kuliah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SKS</Label>
                <Input
                  type="number"
                  value={editForm.sks}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sks: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateCourse}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Topik</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={topicForm.title}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={topicForm.description}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddTopic}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Sesi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor</Label>
              <Input
                type="number"
                value={sessionForm.number}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, number: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={sessionForm.title}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, title: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddSession}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Materi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={materialForm.title}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <select
                value={materialForm.type}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, type: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={materialForm.url}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={materialForm.description}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Topik (opsional)</Label>
              <select
                value={materialForm.topic_id}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    topic_id: Number(e.target.value),
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0}>Tanpa topik</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddMaterial}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Component Dialog */}
      <Dialog open={gradeComponentDialogOpen} onOpenChange={setGradeComponentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGradeComponentId ? "Edit" : "Tambah"} Komponen Nilai
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Komponen</Label>
              <Input
                value={gradeComponentForm.name}
                onChange={(e) =>
                  setGradeComponentForm({ ...gradeComponentForm, name: e.target.value })
                }
                placeholder="Contoh: UTS, UAS, Tugas"
              />
            </div>
            <div className="space-y-2">
              <Label>Bobot (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gradeComponentForm.weight}
                onChange={(e) =>
                  setGradeComponentForm({ ...gradeComponentForm, weight: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeComponentDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddGradeComponent}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
