"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingUp, Award, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCawuStore } from "@/lib/stores/cawu-store";
import { getCourses } from "@/lib/api/courses";
import { getGradeComponents, getGradesForCourse, saveGrade } from "@/lib/api/grades";
import type { IPKData, Course } from "@/types";
import type { GradeComponent } from "@/lib/api/grades";

// Grade mapping with colors
const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "A-": { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  "B+": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  B: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  "B-": { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200" },
  "C+": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  C: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  D: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  E: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

function getLetterGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

function getGradePoint(grade: string): number {
  const points: Record<string, number> = {
    A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, D: 1.0, E: 0.0,
  };
  return points[grade] || 0;
}

export default function IPKPage() {
  const { role } = useAuthStore();
  const { selectedCawu, cawus } = useCawuStore();
  const [cawu, setCawu] = useState<number>(selectedCawu?.id ?? 1);
  const [ipkData, setIpkData] = useState<IPKData[]>([]);
  const [loading, setLoading] = useState(true);
  const [localScores, setLocalScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"detail" | "summary">("detail");

  const isAdmin = role === "SUPER_ADMIN" || role === "KURIKULUM";
  const activeCawuId = selectedCawu?.id ?? cawu;
  console.log("[IPK] selectedCawu:", selectedCawu?.id, "cawu:", cawu, "activeCawuId:", activeCawuId);

  // Sync local cawu state with topbar whenever topbar changes
  useEffect(() => {
    if (selectedCawu?.id) {
      setCawu((prev) => {
        if (prev === 1 || prev === selectedCawu.id) {
          return selectedCawu.id;
        }
        return prev;
      });
    }
  }, [selectedCawu?.id]);

  useEffect(() => {
    loadData();
  }, [activeCawuId]);

  async function loadData() {
    setLoading(true);
    try {
      const courses = await getCourses();
      const filteredCourses = courses.filter(c => c.cawu_id === activeCawuId);

      // Fetch grade components and grades for each course in parallel
      const ipkDataPromises = filteredCourses.map(async (course) => {
        const [components, grades] = await Promise.all([
          getGradeComponents(course.id).catch(() => []),
          getGradesForCourse(course.id).catch(() => []),
        ]);

        // Create score map from grades
        const scoreMap = new Map<number, number | null>();
        grades.forEach(g => scoreMap.set(g.id, g.score));

        // Merge components with scores
        const componentsWithScore = components.map(comp => ({
          ...comp,
          score: scoreMap.get(comp.id) ?? undefined,
        }));

        return {
          course_id: course.id,
          course_code: course.code || course.slug || "",
          course_name: course.name,
          sks: course.sks || 3,
          components: componentsWithScore,
        };
      });

      const data = await Promise.all(ipkDataPromises);
      setIpkData(data);
      setLocalScores({});
    } catch (error) {
      console.error("Failed to load IPK data:", error);
      setIpkData([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateFinalScore(course: IPKData): number {
    if (!course.components || course.components.length === 0) return 0;
    const totalWeight = course.components.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;

    return course.components.reduce((sum, comp) => {
      const scoreKey = `${course.course_id}-${comp.id}`;
      const score = localScores[scoreKey] ?? comp.score;
      if (score == null) return sum;
      return sum + (score * comp.weight) / 100;
    }, 0);
  }

  function calculateIP(): number {
    if (ipkData.length === 0) return 0;
    const totalSKS = ipkData.reduce((sum, c) => sum + c.sks, 0);
    if (totalSKS === 0) return 0;

    const totalWeighted = ipkData.reduce((sum, course) => {
      const finalScore = calculateFinalScore(course);
      const grade = getLetterGrade(finalScore);
      const gradePoint = getGradePoint(grade);
      return sum + (gradePoint * course.sks);
    }, 0);

    return totalWeighted / totalSKS;
  }

  async function handleScoreChange(courseId: number, componentId: number, value: string) {
    const scoreKey = `${courseId}-${componentId}`;
    const numValue = value === "" ? 0 : parseFloat(value);

    setLocalScores((prev) => ({
      ...prev,
      [scoreKey]: numValue,
    }));
  }

  async function handleSave(courseId: number, componentId: number) {
    const scoreKey = `${courseId}-${componentId}`;
    const score = localScores[scoreKey];

    setSaving((prev) => new Set(prev).add(scoreKey));
    try {
      await saveGrade(courseId, componentId, score);
      await loadData();
    } catch (error) {
      console.error("Failed to save grade:", error);
      alert("Gagal menyimpan nilai");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(scoreKey);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const ip = calculateIP();
  const completedCourses = ipkData.filter((c) => {
    const score = calculateFinalScore(c);
    return score > 0;
  }).length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Kalkulator IPK
          </h1>
          <p className="text-muted-foreground mt-1">
            Hitung target IPK Cawu ini
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => alert("Export feature coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Cawu Selector & IP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <div className="p-4">
            <label className="text-sm font-medium mb-2 block">Catur Wulan</label>
            {selectedCawu && cawu === selectedCawu.id && (
              <p className="text-xs text-muted-foreground mb-2">
                Mengikuti cawu aktif di topbar
              </p>
            )}
            <Select value={String(activeCawuId)} onValueChange={(v) => setCawu(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cawus.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    Cawu {c.semester}{c.is_active ? " (Aktif)" : ""}
                  </SelectItem>
                ))}
                {cawus.length === 0 && (
                  <>
                    {[1, 2, 3, 4, 5].map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        Cawu {c}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Target IPK Cawu Ini</p>
                <p className="text-5xl font-bold mt-2">{ip.toFixed(2)}</p>
                <p className="text-sm opacity-90 mt-2">
                  {completedCourses} dari {ipkData.length} mata kuliah diisi
                </p>
              </div>
              <div className="text-right">
                {ip >= 3.75 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                    <Award className="h-5 w-5 mr-2" />
                    Cum Laude
                  </Badge>
                )}
                {ip >= 3.5 && ip < 3.75 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Sangat Baik
                  </Badge>
                )}
                {ip >= 3.0 && ip < 3.5 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                    Baik
                  </Badge>
                )}
                {ip < 3.0 && ip > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                    Perlu Ditingkatkan
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "detail" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("detail")}
        >
          Detail
        </Button>
        <Button
          variant={viewMode === "summary" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("summary")}
        >
          Summary
        </Button>
      </div>

      {/* Summary Table */}
      {viewMode === "summary" && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ringkasan Nilai</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Mata Kuliah</th>
                    <th className="text-center py-2 px-3 font-medium">SKS</th>
                    <th className="text-center py-2 px-3 font-medium">Nilai</th>
                    <th className="text-center py-2 px-3 font-medium">Grade</th>
                    <th className="text-center py-2 px-3 font-medium">Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {ipkData.map((course) => {
                    const finalScore = calculateFinalScore(course);
                    const grade = getLetterGrade(finalScore);
                    const point = getGradePoint(grade);
                    return (
                      <tr key={course.course_id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3">
                          <span className="font-medium">{course.course_name}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-xs">{course.course_code}</span>
                        </td>
                        <td className="text-center py-2 px-3">{course.sks}</td>
                        <td className="text-center py-2 px-3">{finalScore > 0 ? finalScore.toFixed(1) : "-"}</td>
                        <td className="text-center py-2 px-3">
                          {finalScore > 0 ? (
                            <Badge variant="secondary" className="font-semibold">{grade}</Badge>
                          ) : "-"}
                        </td>
                        <td className="text-center py-2 px-3">{finalScore > 0 ? (point * course.sks).toFixed(2) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-2 px-3">Total</td>
                    <td className="text-center py-2 px-3">{ipkData.reduce((s, c) => s + c.sks, 0)}</td>
                    <td className="py-2 px-3"></td>
                    <td className="text-center py-2 px-3">
                      <span className="text-lg">{ip.toFixed(2)}</span>
                    </td>
                    <td className="text-center py-2 px-3">
                      {ipkData.reduce((sum, c) => {
                        const score = calculateFinalScore(c);
                        const grade = getLetterGrade(score);
                        return sum + (getGradePoint(grade) * c.sks);
                      }, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Course Cards */}
      {viewMode === "detail" && (
        <>
          {ipkData.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Mata Kuliah</h3>
                <p className="text-muted-foreground">
                  Admin Kurikulum belum menambahkan mata kuliah untuk Cawu {cawu}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ipkData.map((course) => {
            const finalScore = calculateFinalScore(course);
            const grade = getLetterGrade(finalScore);
            const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.E;

            return (
              <Card key={course.course_id} className="overflow-hidden">
                {/* Course Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{course.course_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{course.course_code}</span>
                        <span>•</span>
                        <span className="font-semibold">{course.sks} SKS</span>
                      </div>
                    </div>
                    {finalScore > 0 && (
                      <div className={`rounded-xl border-2 px-4 py-2 ${gradeColor.bg} ${gradeColor.border}`}>
                        <div className={`text-3xl font-bold ${gradeColor.text}`}>
                          {grade}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {finalScore.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade Components */}
                <div className="p-6 space-y-4">
                  {course.components.map((comp) => {
                    const scoreKey = `${course.course_id}-${comp.id}`;
                    const score = localScores[scoreKey] ?? comp.score;
                    const isSaving = saving.has(scoreKey);

                    return (
                      <div key={comp.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            {comp.name}{" "}
                            <span className="text-muted-foreground">({comp.weight}%)</span>
                          </label>
                          {score != null && score > 0 && (
                            <span className="text-sm text-muted-foreground">
                              Kontribusi: {((score * comp.weight) / 100).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0 - 100"
                            value={score ?? ""}
                            onChange={(e) => handleScoreChange(course.course_id, comp.id, e.target.value)}
                            className="flex-1 px-4 py-3 text-lg font-semibold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                          />
                          <Button
                            onClick={() => handleSave(course.course_id, comp.id)}
                            disabled={isSaving || score == null}
                            size="lg"
                            className="px-6"
                          >
                            {isSaving ? "..." : "Simpan"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Score */}
                  {finalScore > 0 && (
                    <div className="pt-4 border-t-2 border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">Nilai Akhir</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {finalScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
          )}
        </>
      )}
    </div>
  );
}
