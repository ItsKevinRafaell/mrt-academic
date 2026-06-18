"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import type { Course } from "@/types";
import {
  getGradeComponents,
  createGradeComponent,
  updateGradeComponent,
  deleteGradeComponent,
} from "@/lib/api/grades";
import type { GradeComponent } from "@/types/ipk";

interface GradeComponentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
}

export function GradeComponentManagementDialog({
  open,
  onOpenChange,
  course,
}: GradeComponentManagementDialogProps) {
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingComponent, setEditingComponent] = useState<GradeComponent | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    weight: 0,
    type: "assessment",
  });

  useEffect(() => {
    if (open && course) {
      loadComponents();
    }
  }, [open, course]);

  async function loadComponents() {
    setLoading(true);
    try {
      const data = await getGradeComponents(course.id);
      setComponents(data || []);
    } catch (error) {
      console.error("Failed to load grade components:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTotalWeight(): number {
    return components.reduce((sum, comp) => sum + comp.weight, 0);
  }

  function handleEdit(component: GradeComponent) {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      weight: component.weight,
      type: component.type,
    });
    setShowForm(true);
  }

  function handleAdd() {
    setEditingComponent(null);
    setFormData({ name: "", weight: 0, type: "assessment" });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingComponent(null);
    setFormData({ name: "", weight: 0, type: "assessment" });
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("Nama komponen tidak boleh kosong");
      return;
    }

    if (formData.weight <= 0 || formData.weight > 100) {
      alert("Bobot harus antara 1-100%");
      return;
    }

    const newTotal = editingComponent
      ? getTotalWeight() - editingComponent.weight + formData.weight
      : getTotalWeight() + formData.weight;

    if (newTotal > 100) {
      alert(`Total bobot akan menjadi ${newTotal}%. Maksimal 100%`);
      return;
    }

    try {
      if (editingComponent) {
        await updateGradeComponent(editingComponent.id, formData.name, formData.weight, formData.type);
      } else {
        await createGradeComponent(course.id, formData.name, formData.weight, formData.type);
      }
      handleCancel();
      loadComponents();
    } catch (error) {
      console.error("Failed to save grade component:", error);
      alert("Gagal menyimpan komponen nilai");
    }
  }

  async function handleDelete(component: GradeComponent) {
    if (!confirm(`Hapus komponen "${component.name}"?`)) return;

    try {
      await deleteGradeComponent(component.id);
      loadComponents();
    } catch (error) {
      console.error("Failed to delete grade component:", error);
      alert("Gagal menghapus komponen nilai");
    }
  }

  const totalWeight = getTotalWeight();
  const isValid = totalWeight === 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Komposisi Penilaian - {course.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Weight Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Total Bobot:</span>
                  <Badge variant={isValid ? "default" : "destructive"} className="text-lg px-3 py-1">
                    {totalWeight}%
                  </Badge>
                </div>
                {isValid ? (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Valid
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {totalWeight < 100 ? `Kurang ${100 - totalWeight}%` : `Lebih ${totalWeight - 100}%`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Components List or Form */}
          {!showForm ? (
            <div className="space-y-3">
              {components.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Belum ada komponen penilaian
                  </CardContent>
                </Card>
              ) : (
                components.map((component) => (
                  <Card key={component.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{component.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Bobot: {component.weight}%
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(component)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(component)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <Button onClick={handleAdd} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Komponen
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nama Komponen</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: UTS, UAS, Tugas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bobot (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Simpan
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
