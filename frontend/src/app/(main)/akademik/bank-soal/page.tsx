"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, Play, Search } from "lucide-react";
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
import { PDFViewer } from "@/components/pdf-viewer";
import { CBTSimulator } from "@/components/cbt-simulator";
import { getExamArchives, getSimulations, getSimulation } from "@/lib/api/bank-soal";
import type { ExamArchive, Simulation } from "@/types/bank-soal";
import type { Course } from "@/types";
import { getCourses } from "@/lib/api/courses";

export default function BankSoalMahasiswaPage() {
  const [archives, setArchives] = useState<ExamArchive[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      setArchives([]);
      setSimulations([]);
    } finally {
      setLoading(false);
    }
  }

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Soal & Simulasi</h1>
          <p className="text-muted-foreground">Arsip soal ujian dan simulasi CBT untuk latihan</p>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
