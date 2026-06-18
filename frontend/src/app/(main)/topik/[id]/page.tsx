"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Video, Link as LinkIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";

interface TopicPhoto {
  id: number;
  url: string;
  notes?: string;
  created_at: string;
}

interface TopicMaterial {
  id: number;
  title: string;
  type: string;
  url: string;
  description?: string;
}

interface TopicSession {
  id: number;
  title: string;
  description?: string;
  created_at: string;
}

interface TopicDetail {
  id: number;
  title: string;
  course_id: number;
  course_name?: string;
  photos: TopicPhoto[];
  materials: TopicMaterial[];
  sessions: TopicSession[];
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = Number(params.id);

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<TopicPhoto | null>(null);

  useEffect(() => {
    if (!topicId) return;

    async function fetchTopic() {
      try {
        const res = await api.get(`/topics/${topicId}/details`);
        const data = res.data.data;

        const topicDetail: TopicDetail = {
          id: data.id,
          title: data.title,
          course_id: data.course_id,
          course_name: data.course_name || "Mata Kuliah",
          photos: (data.photos || []).sort(
            (a: TopicPhoto, b: TopicPhoto) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          materials: data.materials || [],
          sessions: data.sessions || [],
        };

        setTopic(topicDetail);
      } catch (error) {
        console.error("Failed to fetch topic:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopic();
  }, [topicId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Topik tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div>
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <p className="text-muted-foreground mt-1">{topic.course_name}</p>
        </div>
      </div>

      {/* Photo Gallery */}
      {topic.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto Materi ({topic.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topic.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={photo.url}
                    alt={photo.notes || "Foto materi"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {photo.notes && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 line-clamp-2">
                      {photo.notes}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials */}
      {topic.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Materi ({topic.materials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topic.materials.map((material) => (
                <a
                  key={material.id}
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
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
                    <p className="font-medium">{material.title}</p>
                    {material.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions */}
      {topic.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sesi ({topic.sessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topic.sessions.map((session, index) => (
                <div key={session.id} className="p-3 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{session.title}</p>
                      {session.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {session.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-5xl max-h-[90vh] relative">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.notes || "Foto materi"}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {selectedPhoto.notes && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-4">
                <p className="text-sm">{selectedPhoto.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
