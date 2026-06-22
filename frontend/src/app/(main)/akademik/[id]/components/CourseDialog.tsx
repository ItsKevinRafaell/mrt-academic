"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse, updateCourse } from "@/lib/api/courses";
import { useCawuStore } from "@/lib/stores/cawu-store";
import type { Course, CourseInput } from "@/types";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSaved: () => void;
}

export function CourseDialog({ open, onOpenChange, course, onSaved }: CourseDialogProps) {
  const { selectedCawu } = useCawuStore();
  const [form, setForm] = useState({
    code: "",
    name: "",
    sks: 3,
    description: "",
    instructors: "",
    contact: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setForm({
        code: course.code,
        name: course.name,
        sks: course.sks,
        description: course.description || "",
        instructors: course.instructors?.join(", ") || "",
        contact: "",
      });
    } else {
      setForm({
        code: "",
        name: "",
        sks: 3,
        description: "",
        instructors: "",
        contact: "",
      });
    }
  }, [course, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input: CourseInput = {
        code: form.code,
        name: form.name,
        sks: form.sks,
        description: form.description || undefined,
        instructors: form.instructors
          ? form.instructors.split(",").map((s) => s.trim())
          : [],
        cawu_id: selectedCawu?.id,
      };
      if (course) {
        await updateCourse(course.id, input);
      } else {
        await createCourse(input);
      }
      onSaved();
    } catch {
      alert("Gagal menyimpan mata kuliah");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit" : "Tambah"} Mata Kuliah</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CS101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>SKS</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={form.sks}
                onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nama Mata Kuliah</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Struktur Data"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Dosen (pisah dengan koma)</Label>
            <Input
              value={form.instructors}
              onChange={(e) => setForm({ ...form, instructors: e.target.value })}
              placeholder="Dr. Andi, Prof. Budi"
            />
          </div>
          <div className="space-y-2">
            <Label>Kontak Dosen (opsional)</Label>
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="email@dosen.ac.id / 0812..."
            />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi singkat..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
