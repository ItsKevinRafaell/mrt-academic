"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourses } from "@/lib/api/courses";
import { useCawuStore } from "@/lib/stores/cawu-store";
import type { Course } from "@/types";

export default function AkademikPage() {
  const router = useRouter();
  const { selectedCawu } = useCawuStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, [selectedCawu]);

  const filteredCourses = selectedCawu
    ? courses.filter(course => course.cawu_id === selectedCawu.id)
    : courses;

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: number) => {
    router.push(`/akademik/${courseId}`);
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold text-foreground">Akademik</h1>
        <p className="text-muted-foreground mt-2">
          {filteredCourses.length} mata kuliah {selectedCawu ? `untuk Cawu ${selectedCawu.semester}` : 'tersedia'}
        </p>
      </div>

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
              onClick={() => handleCourseClick(course.id)}
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
