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
  CheckCircle2,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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
import { LiveBoardGallery } from "@/components/LiveBoardGallery";
import { getSession, type Session } from "@/lib/api/sessions";
import { getMaterialsBySession, createMaterial, deleteMaterial, type Material } from "@/lib/api/materials";
import { getCourse } from "@/lib/api/courses";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";
import { useConfirm, ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const sessionId = parseInt(params.sessionId as string);

  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);
  const { confirm, ConfirmDialog } = useConfirm();

  const [session, setSession] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courseName, setCourseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "link" as "pdf" | "image" | "link" | "video" | "ppt",
    url: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // Refresh materials after mutations
  const refreshMaterials = async () => {
    const data = await getMaterialsBySession(sessionId);
    setMaterials(data || []);
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.title || !newMaterial.url) return;
    try {
      await createMaterial({
        session_id: sessionId,
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
    setFile(f);
    // For now, just use file name as URL placeholder
    // In real app, you'd upload to storage
    setNewMaterial((m) => ({ ...m, url: `file://${f.name}` }));
  };

  useEffect(() => {
    loadData();
  }, [courseId, sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionData, materialsData, courseData] = await Promise.all([
        getSession(sessionId),
        getMaterialsBySession(sessionId),
        getCourse(courseId),
      ]);

      if (!sessionData) {
        setSession(null);
        return;
      }

      setSession(sessionData);
      setMaterials(materialsData || []);
      if (courseData) {
        setCourseName(courseData.name || "");
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setSession(null);
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Sesi Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">
            Sesi yang Anda cari tidak ditemukan atau telah dihapus.
          </p>
          <Button onClick={() => router.push(`/akademik/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Mata Kuliah
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Akademik", href: "/akademik" },
          { label: courseName, href: `/akademik/${courseId}` },
          { label: `Sesi ${session.number}` },
        ]}
      />

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/akademik/${courseId}`)}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Mata Kuliah
      </Button>

      {/* Session Header */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" className="text-xs">
                  Sesi {session.number}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
              {session.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {session.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Session Meta */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-primary/10">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(new Date(session.created_at), "EEEE, d MMMM yyyy", { locale: id })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Section: Main Materials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Materi Utama</h2>
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
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Materi Sesi
                </h3>
                <Badge variant="outline">{materials.length} materi</Badge>
              </div>
              <Separator className="mb-4" />
              <div className="grid gap-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 flex-1"
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
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
                    </a>
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
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Belum ada materi untuk sesi ini</p>
            </div>
          </Card>
        )}
      </section>

      <ConfirmDialog />

      {/* Bottom Section: Live Board Gallery */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Live Board Gallery</h2>
        <LiveBoardGallery sessionId={sessionId} courseId={courseId} />
      </section>
    </div>
  );
}
