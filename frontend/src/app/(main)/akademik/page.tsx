"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/ui/page-container";
import { CourseCard } from "@/components/ui/course-card";
import { EmptyState } from "@/components/ui/empty-state";
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
import { BookOpen } from "lucide-react";

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
    ? courses.filter((course) => course.cawu_id === selectedCawu.id)
    : courses;

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code || !newCourse.sks || !selectedCawu)
      return;
    try {
      await createCourse.mutateAsync({
        name: newCourse.name,
        code: newCourse.code,
        sks: parseInt(newCourse.sks),
        course_type: newCourse.course_type,
        cawu_id: selectedCawu.id,
      });
      setShowAddCourse(false);
      setNewCourse({
        name: "",
        code: "",
        sks: "",
        course_type: "lecturer",
        cawu_id: 0,
      });
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Gagal membuat mata kuliah");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Akademik"
        description={`${filteredCourses.length} mata kuliah ${
          selectedCawu ? `untuk Cawu ${selectedCawu.semester}` : "tersedia"
        }`}
      >
        {isKurikulum && (
          <Button onClick={() => setShowAddCourse(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mata Kuliah
          </Button>
        )}
      </PageHeader>

      {/* Add Course Form */}
      {showAddCourse && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Tambah Mata Kuliah Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Matkul</label>
                  <Input
                    placeholder="e.g. Pemrograman Web"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode</label>
                  <Input
                    placeholder="e.g. CS101"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse((c) => ({ ...c, code: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKS</label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={newCourse.sks}
                    onChange={(e) =>
                      setNewCourse((c) => ({ ...c, sks: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe</label>
                  <Select
                    value={newCourse.course_type}
                    onValueChange={(v) =>
                      setNewCourse((c) => ({
                        ...c,
                        course_type: v as any,
                      }))
                    }
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
                  disabled={
                    !newCourse.name ||
                    !newCourse.code ||
                    !newCourse.sks ||
                    createCourse.isPending
                  }
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
        <EmptyState
          icon={BookOpen}
          title={
            selectedCawu
              ? "Belum ada mata kuliah untuk cawu ini"
              : "Belum ada mata kuliah tersedia"
          }
          description="Mata kuliah akan muncul di sini setelah ditambahkan oleh admin."
          action={
            isKurikulum
              ? {
                  label: "Tambah Mata Kuliah",
                  onClick: () => setShowAddCourse(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              name={course.name}
              code={course.code}
              sks={course.sks}
              course_type={course.course_type}
              cawu_id={course.cawu_id}
              instructors={course.instructors}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
