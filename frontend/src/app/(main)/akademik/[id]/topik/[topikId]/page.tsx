"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
  BookOpen,
  Calendar,
  Plus,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageContainer } from "@/components/ui/page-container";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotesPage } from "@/components/NotesPage";
import { getTopicDetails } from "@/lib/api/topics";
import type { Topic } from "@/types";
import { getMaterialsByTopic, createMaterialForTopic, deleteMaterial, type Material } from "@/lib/api/materials";
import { getBoardGalleryByTopic, type BoardGalleryItem } from "@/lib/api/board-gallery";
import { LiveBoardGalleryTopic } from "@/components/LiveBoardGalleryTopic";
import { getCourse } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";
import { useConfirm, ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function TopikDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const topicId = parseInt(params.topikId as string);

  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);
  const { confirm, ConfirmDialog } = useConfirm();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<BoardGalleryItem[]>([]);
  const [courseName, setCourseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "link" as "pdf" | "image" | "link" | "video" | "ppt",
    url: "",
  });

  const refreshMaterials = async () => {
    const data = await getMaterialsByTopic(topicId);
    setMaterials(data || []);
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title || !newMaterial.url) return;
    try {
      await createMaterialForTopic(topicId, {
        topic_id: topicId,
        title: newMaterial.title,
        description: newMaterial.description,
        type: newMaterial.type,
        url: newMaterial.url,
      });
      setShowAddMaterial(false);
      setNewMaterial({ title: "", description: "", type: "link", url: "" });
      refreshMaterials();
    } catch (error) {
      console.error("Failed to add material:", error);
      alert("Gagal menambahkan materi");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    await confirm({
      title: "Hapus Materi?",
      description: "Materi akan dihapus permanent.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        await deleteMaterial(id);
        refreshMaterials();
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewMaterial((m) => ({ ...m, url: `file://${f.name}` }));
  };

  useEffect(() => {
    loadData();
  }, [courseId, topicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const topicData = await getTopicDetails(topicId).catch(() => null);
      if (!topicData) {
        setTopic(null);
        setLoading(false);
        return;
      }
      setTopic(topicData as Topic);

      const materialsData = await getMaterialsByTopic(topicId).catch(() => []);
      setMaterials(materialsData || []);

      const photosData = await getBoardGalleryByTopic(topicId).catch(() => []);
      setPhotos(photosData || []);

      const courseData = await getCourse(courseId).catch(() => null);
      if (courseData) {
        setCourseName(courseData.name || "");
      }
    } catch (error) {
      console.error("Failed to load topic:", error);
      setTopic(null);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "link":
        return <LinkIcon className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "bg-red-500/10 text-red-600";
      case "video":
        return "bg-blue-500/10 text-blue-600";
      case "link":
        return "bg-green-500/10 text-green-600";
      case "image":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!topic) {
    return (
      <PageContainer>
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Topik Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">
            Topik yang Anda cari tidak ditemukan atau telah dihapus.
          </p>
          <Button onClick={() => router.push(`/akademik/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Mata Kuliah
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-4 lg:space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Akademik", href: "/akademik" },
          { label: courseName, href: `/akademik/${courseId}` },
          { label: topic.title },
        ]}
      />

      {/* Topic Header */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" className="text-xs">
                  Topik
                </Badge>
              </div>
              <h1 className="text-xl lg:text-3xl font-bold mb-2">{topic.title}</h1>
              {topic.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {topic.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 lg:w-8 lg:h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Topic Meta */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-primary/10">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(new Date(topic.created_at), "EEEE, d MMMM yyyy", { locale: id })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Section: Main Materials */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl lg:text-2xl font-bold">Materi Utama</h2>
          {isKurikulum && (
            <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Materi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Materi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial((m) => ({ ...m, title: e.target.value }))}
                      placeholder="Judul materi..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial((m) => ({ ...m, description: e.target.value }))}
                      placeholder="Deskripsi (opsional)..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={newMaterial.type} onValueChange={(v) => setNewMaterial((m) => ({ ...m, type: v as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="ppt">PPT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL / File</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newMaterial.url}
                        onChange={(e) => setNewMaterial((m) => ({ ...m, url: e.target.value }))}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      <div className="relative">
                        <Input
                          type="file"
                          className="cursor-pointer"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddMaterial(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleAddMaterial} disabled={!newMaterial.title || !newMaterial.url}>
                      Simpan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {materials.length > 0 ? (
          <Card>
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Materi Topik
                </h3>
                <Badge variant="outline">{materials.length} materi</Badge>
              </div>
              <Separator className="mb-4" />
              <div className="grid gap-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 lg:p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <button
                      onClick={() => {
                        if (material.url.startsWith('http')) {
                          window.open(material.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="flex items-center gap-3 lg:gap-4 flex-1 text-left"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                          getMaterialColor(material.type)
                        )}
                      >
                        {getMaterialIcon(material.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {material.title}
                        </h4>
                        {material.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {material.description}
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(material.created_at), "HH:mm")}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {material.type}
                      </Badge>
                      {isKurikulum && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-8 lg:p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Belum ada materi untuk topik ini</p>
            </div>
          </Card>
        )}
      </section>

      <ConfirmDialog />

      {/* Bottom Section: Live Board Gallery */}
      <section className="space-y-4">
        <h2 className="text-xl lg:text-2xl font-bold">Live Board Gallery</h2>
        <LiveBoardGalleryTopic topicId={topicId} courseId={courseId} />
      </section>

      {/* Notes for this topic */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl font-bold">Catatan Topik Ini</h2>
          <Button variant="outline" size="sm" onClick={() => router.push(`/catatan`)}>
            Lihat Semua Catatan
          </Button>
        </div>
        <NotesPage courseId={courseId} topikId={topicId} />
      </section>
    </PageContainer>
  );
}
