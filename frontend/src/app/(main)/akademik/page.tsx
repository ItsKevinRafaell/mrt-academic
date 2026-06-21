"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourses, useCreateCourse } from "@/lib/api/courses";
import { useCawuStore } from "@/lib/stores/cawu-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { canManageAcademic } from "@/lib/rbac";

export default function AkademikPage() {
  const router = useRouter();
  const { selectedCawu } = useCawuStore();
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();

  const { role } = useAuthStore();
  const isKurikulum = role && canManageAcademic(role);

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    sks: "",
    course_type: "lecturer" as "lecturer" | "lab",
    cawu_id: 0,
  });

  const filteredCourses = selectedCawu
    ? courses.filter(course => course.cawu_id === selectedCawu.id)
    : courses;

  const handleCourseClick = (course: any) => {
    router.push(`/akademik/${course.id}`);
  };

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code || !newCourse.sks || !selectedCawu) return;
    try {
      await createCourse.mutateAsync({
        name: newCourse.name,
        code: newCourse.code,
        sks: parseInt(newCourse.sks),
        course_type: newCourse.course_type,
        cawu_id: selectedCawu.id,
      });
      setShowAddCourse(false);
      setNewCourse({ name: "", code: "", sks: "", course_type: "lecturer", cawu_id: 0 });
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Gagal membuat mata kuliah");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Akademik</h1>
          <p className="text-muted-foreground mt-2">
            Daftar mata kuliah {selectedCawu ? `untuk Cawu ${selectedCawu.semester}` : 'yang tersedia'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Akademik</h1>
            <p className="text-muted-foreground mt-2">
              {filteredCourses.length} mata kuliah {selectedCawu ? `untuk Cawu ${selectedCawu.semester}` : 'tersedia'}
            </p>
          </div>
          {isKurikulum && (
            <Button onClick={() => setShowAddCourse(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Mata Kuliah
            </Button>
          )}
        </div>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Tambah Mata Kuliah Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Matkul</label>
                  <Input
                    placeholder="e.g. Pemrograman Web"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode</label>
                  <Input
                    placeholder="e.g. CS101"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse((c) => ({ ...c, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKS</label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={newCourse.sks}
                    onChange={(e) => setNewCourse((c) => ({ ...c, sks: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe</label>
                  <Select
                    value={newCourse.course_type}
                    onValueChange={(v) => setNewCourse((c) => ({ ...c, course_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddCourse}
                  disabled={!newCourse.name || !newCourse.code || !newCourse.sks || createCourse.isPending}
                >
                  {createCourse.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddCourse(false)}>
                  Batal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">
            {selectedCawu ? 'Belum ada mata kuliah untuk cawu ini' : 'Belum ada mata kuliah tersedia'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="bento-card p-6 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                {course.course_type && (
                  <Badge variant="secondary" className="text-xs">
                    {course.course_type === 'lab' ? 'Lab' : 'Lecturer'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {course.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{course.code}</span>
                  <span>•</span>
                  <span>{course.sks} SKS</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
