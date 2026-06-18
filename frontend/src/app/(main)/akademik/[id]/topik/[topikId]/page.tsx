"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText, Video, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbox } from "@/components/ui/lightbox";
import { getTopicDetails } from "@/lib/api/topics";
import { getMaterialsBySession } from "@/lib/api/materials";
import { getPhotosBySession } from "@/lib/api/photos";
import type { Topic, Material } from "@/types";
import type { Photo } from "@/types/photo";
import type { TopicSession } from "@/types/topic";

export default function TopikDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const topicId = parseInt(params.topikId as string);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [sessions, setSessions] = useState<TopicSession[]>([]);
  const [materialsBySession, setMaterialsBySession] = useState<Record<number, Material[]>>({});
  const [photosBySession, setPhotosBySession] = useState<Record<number, Photo[]>>({});
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId, topicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const topicData = await getTopicDetails(topicId);
      setTopic(topicData);
      setSessions(topicData.sessions || []);

      // Load materials and photos for each session
      const materialsPromises = topicData.sessions.map((session: TopicSession) =>
        getMaterialsBySession(session.id)
      );
      const photosPromises = topicData.sessions.map((session: TopicSession) =>
        getPhotosBySession(courseId, session.id)
      );

      const [materialsResults, photosResults] = await Promise.all([
        Promise.all(materialsPromises),
        Promise.all(photosPromises),
      ]);

      // Map materials and photos to sessions
      const materialsMap: Record<number, Material[]> = {};
      const photosMap: Record<number, Photo[]> = {};

      topicData.sessions.forEach((session: TopicSession, index: number) => {
        materialsMap[session.id] = materialsResults[index] || [];
        photosMap[session.id] = photosResults[index] || [];
      });

      setMaterialsBySession(materialsMap);
      setPhotosBySession(photosMap);
    } catch (error) {
      console.error("Failed to load topic data:", error);

      // Inject rich dummy data if API fails or returns empty
      const dummySessions: TopicSession[] = [
        {
          id: 1,
          course_id: parseInt(params.id as string),
          title: "Pengantar Uninformed Search",
          description: "Memahami konsep dasar pencarian tanpa informasi heuristik",
          number: 1,
        },
        {
          id: 2,
          course_id: parseInt(params.id as string),
          title: "Breadth-First Search (BFS)",
          description: "Algoritma pencarian melebar dan aplikasinya",
          number: 2,
        },
        {
          id: 3,
          course_id: parseInt(params.id as string),
          title: "Depth-First Search (DFS)",
          description: "Algoritma pencarian mendalam dan perbandingan dengan BFS",
          number: 3,
        },
      ];

      setSessions(dummySessions);

      // Dummy materials
      const dummyMaterials: Record<number, Material[]> = {
        1: [
          { id: 1, session_id: 1, title: "Slide Pengantar Uninformed Search", type: "pdf", url: "/dummy/uninformed-search-intro.pdf", created_at: "2024-01-10T10:00:00Z", updated_at: "2024-01-10T10:00:00Z" },
          { id: 2, session_id: 1, title: "Video Penjelasan Konsep Dasar", type: "video", url: "https://youtube.com/watch?v=dummy1", created_at: "2024-01-10T10:00:00Z", updated_at: "2024-01-10T10:00:00Z" },
          { id: 3, session_id: 1, title: "Artikel Referensi", type: "link", url: "https://example.com/uninformed-search", created_at: "2024-01-10T10:00:00Z", updated_at: "2024-01-10T10:00:00Z" },
        ],
        2: [
          { id: 4, session_id: 2, title: "Slide BFS Algorithm", type: "pdf", url: "/dummy/bfs-algorithm.pdf", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
          { id: 5, session_id: 2, title: "Video Tutorial BFS", type: "video", url: "https://youtube.com/watch?v=dummy2", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z" },
        ],
        3: [
          { id: 6, session_id: 3, title: "Slide DFS Algorithm", type: "pdf", url: "/dummy/dfs-algorithm.pdf", created_at: "2024-01-20T10:00:00Z", updated_at: "2024-01-20T10:00:00Z" },
          { id: 7, session_id: 3, title: "Video Tutorial DFS", type: "video", url: "https://youtube.com/watch?v=dummy3", created_at: "2024-01-20T10:00:00Z", updated_at: "2024-01-20T10:00:00Z" },
          { id: 8, session_id: 3, title: "Perbandingan BFS vs DFS", type: "link", url: "https://example.com/bfs-vs-dfs", created_at: "2024-01-20T10:00:00Z", updated_at: "2024-01-20T10:00:00Z" },
        ],
      };

      // Dummy photos with real image URLs
      const dummyPhotos: Record<number, Photo[]> = {
        1: [
          { id: 1, session_id: 1, title: "Diagram State Space", caption: "Contoh state space untuk problem solving", url: "https://images.unsplash.com/photo-1516339901601-2e1b73f4f9c3?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, session_id: 1, title: "Pohon Pencarian", caption: "Visualisasi tree search", url: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, session_id: 1, title: "Flowchart Algoritma", caption: "Flowchart uninformed search", url: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        2: [
          { id: 4, session_id: 2, title: "BFS Queue Visualization", caption: "Visualisasi queue pada BFS", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 5, session_id: 2, title: "BFS Level by Level", caption: "Traversal level by level", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 6, session_id: 2, title: "Contoh Graph BFS", caption: "Graph traversal contoh", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 7, session_id: 2, title: "BFS Pseudocode", caption: "Pseudocode algoritma BFS", url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        3: [
          { id: 8, session_id: 3, title: "DFS Stack Visualization", caption: "Visualisasi stack pada DFS", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 9, session_id: 3, title: "DFS Backtracking", caption: "Konsep backtracking pada DFS", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 10, session_id: 3, title: "DFS vs BFS Comparison", caption: "Perbandingan traversal", url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      };

      setMaterialsBySession(dummyMaterials);
      setPhotosBySession(dummyPhotos);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "link":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Topik tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/akademik/${courseId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Mata Kuliah
      </Button>

      {/* Topic Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
        {topic.description && (
          <p className="text-muted-foreground">{topic.description}</p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            {sessions.length} Sesi
          </Badge>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Sessions Chronological List */}
      <div className="space-y-8">
        {sessions.map((session, index) => {
          const sessionMaterials = materialsBySession[session.id] || [];
          const sessionPhotos = photosBySession[session.id] || [];

          return (
            <Card key={session.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Session Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{session.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Sesi {session.number}</span>
                      </div>
                    </div>
                  </div>
                  {session.description && (
                    <p className="text-muted-foreground ml-11">{session.description}</p>
                  )}
                </div>

                {/* PDF and Video Links */}
                {sessionMaterials.length > 0 && (
                  <div className="mb-6 ml-11">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Materi Pembelajaran
                    </h3>
                    <div className="space-y-2">
                      {sessionMaterials.map((material) => (
                        <a
                          key={material.id}
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                            {getMaterialIcon(material.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium group-hover:text-primary transition-colors">
                              {material.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {material.type.toUpperCase()}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Grid */}
                {sessionPhotos.length > 0 && (
                  <div className="ml-11">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Foto Papan Tulis
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {sessionPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group cursor-pointer"
                          onClick={() => handlePhotoClick(photo)}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors">
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium truncate">{photo.title}</p>
                            {photo.caption && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {sessionMaterials.length === 0 && sessionPhotos.length === 0 && (
                  <div className="text-center py-8 ml-11">
                    <p className="text-sm text-muted-foreground">
                      Belum ada materi untuk sesi ini
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          open={lightboxOpen}
          onClose={() => {
            setLightboxOpen(false);
            setSelectedPhoto(null);
          }}
          imageUrl={selectedPhoto.url}
          title={selectedPhoto.title}
          caption={selectedPhoto.caption}
        />
      )}
    </div>
  );
}
