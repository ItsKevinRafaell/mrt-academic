"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCawus,
  createCawu,
  updateCawu,
  deleteCawu,
  setActiveCawu,
  type Cawu,
} from "@/lib/api/cawu";
import { useCawuStore } from "@/lib/stores/cawu-store";
import { useConfirm, ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CawuManagementDialog() {
  const [open, setOpen] = useState(false);
  const [cawus, setCawus] = useState<Cawu[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCawu, setEditingCawu] = useState<Cawu | null>(null);
  const [form, setForm] = useState({ semester: "", year: "", name: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);
  const { selectedCawu, setSelectedCawu, setCawus: setStoreCawus } = useCawuStore();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (open) loadCawus();
  }, [open]);

  async function loadCawus() {
    setLoading(true);
    try {
      const data = await getCawus();
      setCawus(data);
      setStoreCawus(data);
    } catch (error) {
      console.error("Failed to load cawus:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.semester || !form.year) return;
    setSaving(true);
    try {
      if (editingCawu) {
        await updateCawu(editingCawu.id, {
          name: form.name || `Cawu ${form.semester}`,
          semester: parseInt(form.semester),
          year: parseInt(form.year),
          start_date: form.start_date || undefined,
          end_date: form.end_date || undefined,
        });
      } else {
        await createCawu({
          name: form.name || `Cawu ${form.semester}`,
          semester: parseInt(form.semester),
          year: parseInt(form.year),
          start_date: form.start_date || new Date().toISOString().slice(0, 10),
          end_date: form.end_date || new Date().toISOString().slice(0, 10),
          is_active: false,
        });
      }
      setForm({ semester: "", year: "", name: "", start_date: "", end_date: "" });
      setEditingCawu(null);
      setShowForm(false);
      await loadCawus();
    } catch (error) {
      console.error("Failed to save cawu:", error);
      alert("Gagal menyimpan cawu");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(id: number) {
    try {
      await setActiveCawu(id);
      const active = cawus.find((c) => c.id === id);
      if (active) {
        setSelectedCawu(active);
      }
      await loadCawus();
    } catch (error) {
      console.error("Failed to set active cawu:", error);
      alert("Gagal mengubah cawu aktif");
    }
  }

  async function handleDelete(id: number) {
    await confirm({
      title: "Hapus Cawu?",
      description: "Cawu akan dihapus. Data terkait tidak akan dihapus.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        await deleteCawu(id);
        if (selectedCawu?.id === id) {
          setSelectedCawu(null);
        }
        await loadCawus();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kelola Cawu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cawu List */}
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Memuat...</p>
          ) : (
            <div className="space-y-2">
              {cawus.map((cawu) => (
                <Card key={cawu.id} className={cawu.is_active ? "border-primary" : ""}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Cawu {cawu.semester}</span>
                          {cawu.is_active && (
                            <Badge variant="default" className="text-xs">Aktif</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cawu.year} {cawu.name !== `Cawu ${cawu.semester}` ? `— ${cawu.name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!cawu.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetActive(cawu.id)}
                          >
                            Set Aktif
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCawu(cawu);
                            setForm({
                              semester: String(cawu.semester),
                              year: String(cawu.year),
                              name: cawu.name,
                              start_date: cawu.start_date || "",
                              end_date: cawu.end_date || "",
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cawu.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium">{editingCawu ? "Edit" : "Tambah"} Cawu</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input
                      type="number"
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      placeholder="2025"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama (opsional)</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Cawu 3 Ganjil"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCawu(null);
                      setForm({ semester: "", year: "", name: "", start_date: "", end_date: "" });
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingCawu(null);
                setForm({ semester: "", year: "", name: "", start_date: "", end_date: "" });
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Cawu
            </Button>
          )}
        </div>

        <ConfirmDialog />
      </DialogContent>
    </Dialog>
  );
}
