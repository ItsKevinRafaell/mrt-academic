"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course, Session } from "@/types";
import type { Topic, TopicWithDetails } from "@/types/topic";
import {
  getTopicsByCourse,
  getTopicDetails,
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  assignSessionToTopic,
  removeSessionFromTopic,
  assignMaterialToTopic,
  removeMaterialFromTopic,
} from "@/lib/api/topics";
import { getMaterialsByCourse } from "@/lib/api/materials";
import type { Material } from "@/types/material";

interface TopicManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  initialCourse?: Course | null;
}

export function TopicManagementDialog({
  open,
  onOpenChange,
  courses,
  initialCourse,
}: TopicManagementDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicWithDetails | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialCourse) {
      setSelectedCourseId(String(initialCourse.id));
    }
  }, [open, initialCourse]);

  useEffect(() => {
    if (selectedCourseId) {
      loadTopics();
      loadCourseData();
    }
  }, [selectedCourseId]);

  async function loadTopics() {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const data = await getTopicsByCourse(Number(selectedCourseId));
      setTopics(data);
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourseData() {
    if (!selectedCourseId) return;
    try {
      const { getSessions } = await import("@/lib/api/sessions");
      const [sessionsData, materialsData] = await Promise.all([
        getSessions(Number(selectedCourseId)),
        getMaterialsByCourse(Number(selectedCourseId)),
      ]);
      setSessions(sessionsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Failed to load course data:", error);
    }
  }

  async function handleCreateTopic(name: string, description: string) {
    if (!selectedCourseId || !name.trim()) return;
    try {
      await createTopic(Number(selectedCourseId), { name, description });
      await loadTopics();
      setShowTopicForm(false);
    } catch (error) {
      console.error("Failed to create topic:", error);
      alert("Gagal membuat topik");
    }
  }

  async function handleUpdateTopic(id: number, name: string, description: string) {
    if (!name.trim()) return;
    try {
      await updateTopic(id, { name, description });
      await loadTopics();
      setEditingTopic(null);
      setShowTopicForm(false);
    } catch (error) {
      console.error("Failed to update topic:", error);
      alert("Gagal mengupdate topik");
    }
  }

  async function handleDeleteTopic(id: number) {
    if (!confirm("Yakin ingin menghapus topik ini?")) return;
    try {
      await deleteTopic(id);
      await loadTopics();
      if (selectedTopic?.id === id) {
        setSelectedTopic(null);
      }
    } catch (error) {
      console.error("Failed to delete topic:", error);
      alert("Gagal menghapus topik");
    }
  }

  async function handleReorder(newOrder: number[]) {
    if (!selectedCourseId) return;
    try {
      await reorderTopics(Number(selectedCourseId), { topic_ids: newOrder });
      await loadTopics();
    } catch (error) {
      console.error("Failed to reorder topics:", error);
      alert("Gagal mengurutkan topik");
    }
  }

  async function handleViewTopicDetails(topic: Topic) {
    try {
      const details = await getTopicDetails(topic.id);
      setSelectedTopic(details);
    } catch (error) {
      console.error("Failed to load topic details:", error);
      alert("Gagal memuat detail topik");
    }
  }

  async function handleAssignSession(sessionId: number) {
    if (!selectedTopic) return;
    try {
      await assignSessionToTopic(selectedTopic.id, sessionId);
      await handleViewTopicDetails(selectedTopic);
    } catch (error) {
      console.error("Failed to assign session:", error);
      alert("Gagal menambahkan sesi ke topik");
    }
  }

  async function handleRemoveSession(sessionId: number) {
    if (!selectedTopic) return;
    if (!confirm("Yakin ingin menghapus sesi dari topik ini?")) return;
    try {
      await removeSessionFromTopic(selectedTopic.id, sessionId);
      await handleViewTopicDetails(selectedTopic);
    } catch (error) {
      console.error("Failed to remove session:", error);
      alert("Gagal menghapus sesi dari topik");
    }
  }

  async function handleAssignMaterial(materialId: number) {
    if (!selectedTopic) return;
    try {
      await assignMaterialToTopic(selectedTopic.id, materialId);
      await handleViewTopicDetails(selectedTopic);
    } catch (error) {
      console.error("Failed to assign material:", error);
      alert("Gagal menambahkan materi ke topik");
    }
  }

  async function handleRemoveMaterial(materialId: number) {
    if (!selectedTopic) return;
    if (!confirm("Yakin ingin menghapus materi dari topik ini?")) return;
    try {
      await removeMaterialFromTopic(selectedTopic.id, materialId);
      await handleViewTopicDetails(selectedTopic);
    } catch (error) {
      console.error("Failed to remove material:", error);
      alert("Gagal menghapus materi dari topik");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Kelola Topik</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Course Selector */}
          <div className="space-y-2">
            <Label>Mata Kuliah</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourseId && (
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Topics List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Daftar Topik</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingTopic(null);
                      setShowTopicForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Topik
                  </Button>
                </div>

                {showTopicForm && (
                  <TopicForm
                    topic={editingTopic}
                    onSave={async (name, description) => {
                      if (editingTopic) {
                        await handleUpdateTopic(editingTopic.id, name, description);
                      } else {
                        await handleCreateTopic(name, description);
                      }
                    }}
                    onCancel={() => {
                      setShowTopicForm(false);
                      setEditingTopic(null);
                    }}
                  />
                )}

                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Memuat...</p>
                ) : topics.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada topik
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topics.map((topic, index) => (
                      <Card
                        key={topic.id}
                        className={`cursor-pointer transition-colors ${
                          selectedTopic?.id === topic.id ? "border-primary" : ""
                        }`}
                        onClick={() => handleViewTopicDetails(topic)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{topic.title}</h4>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTopic(topic);
                                  setShowTopicForm(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTopic(topic.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Topic Details */}
              <div className="space-y-4">
                {selectedTopic ? (
                  <>
                    <h3 className="text-lg font-semibold">
                      Detail: {selectedTopic.title}
                    </h3>

                    {/* Sessions Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Sesi ({selectedTopic.sessions.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedTopic.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div>
                              <p className="font-medium">Sesi {session.number}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.title}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveSession(session.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        {/* Add Session */}
                        <div className="pt-2">
                          <Label className="text-sm">Tambah Sesi</Label>
                          <Select
                            onValueChange={(value) => handleAssignSession(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih sesi..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sessions
                                .filter(
                                  (s) =>
                                    !selectedTopic.sessions.some(
                                      (ts) => ts.id === s.id
                                    )
                                )
                                .map((session) => (
                                  <SelectItem
                                    key={session.id}
                                    value={String(session.id)}
                                  >
                                    Sesi {session.number} - {session.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Materials Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Materi ({selectedTopic.materials.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedTopic.materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{material.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {material.type}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMaterial(material.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        {/* Add Material */}
                        <div className="pt-2">
                          <Label className="text-sm">Tambah Materi</Label>
                          <Select
                            onValueChange={(value) => handleAssignMaterial(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih materi..." />
                            </SelectTrigger>
                            <SelectContent>
                              {materials
                                .filter(
                                  (m) =>
                                    !selectedTopic.materials.some(
                                      (tm) => tm.id === m.id
                                    )
                                )
                                .map((material) => (
                                  <SelectItem
                                    key={material.id}
                                    value={String(material.id)}
                                  >
                                    {material.title} ({material.type})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Pilih topik untuk melihat detail
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TopicFormProps {
  topic: Topic | null;
  onSave: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}

function TopicForm({ topic, onSave, onCancel }: TopicFormProps) {
  const [title, setTitle] = useState(topic?.title || "");
  const [description, setDescription] = useState(topic?.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(title, description);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Nama Topik</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengenalan OOP"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi (opsional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi topik..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              <Check className="h-4 w-4 mr-1" />
              {saving ? "Menyimpan..." : topic ? "Update" : "Simpan"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
