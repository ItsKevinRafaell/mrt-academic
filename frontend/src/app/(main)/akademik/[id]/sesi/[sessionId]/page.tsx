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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LiveBoardGallery } from "@/components/LiveBoardGallery";
import { getSession, type Session } from "@/lib/api/sessions";
import { getMaterialsBySession, type Material } from "@/lib/api/materials";
import { getCourse } from "@/lib/api/courses";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const sessionId = parseInt(params.sessionId as string);

  const [session, setSession] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courseName, setCourseName] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
        <h2 className="text-2xl font-bold">Materi Utama</h2>
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
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group"
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
                    <Badge variant="outline" className="text-xs capitalize">
                      {material.type}
                    </Badge>
                  </a>
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

      {/* Bottom Section: Live Board Gallery */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Live Board Gallery</h2>
        <LiveBoardGallery sessionId={sessionId} courseId={courseId} />
      </section>
    </div>
  );
}
