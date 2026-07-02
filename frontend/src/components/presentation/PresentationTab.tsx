"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Trash2, Check, X, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  getPresentationConfig,
  setPresentationMode,
  getPriorityStudents,
  addPriorityStudent,
  removePriorityStudent,
  reorderPriorityStudents,
  getLeaderboard,
  getAllStudents,
  recordPresentation,
} from "@/lib/api/presentation";
import type { PresentationConfig, PriorityStudent, LeaderboardEntry, Student, PresentationMode } from "@/types";

interface PresentationTabProps {
  courseId: number;
  isKurikulum?: boolean;
}

export function PresentationTab({ courseId, isKurikulum }: PresentationTabProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [config, setConfig] = useState<PresentationConfig | null>(null);
  const [priorityStudents, setPriorityStudents] = useState<PriorityStudent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk add state
  const [startNomorUrut, setStartNomorUrut] = useState("1");
  const [countNomorUrut, setCountNomorUrut] = useState("5");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, priority, leader, students] = await Promise.all([
        getPresentationConfig(courseId),
        getPriorityStudents(courseId),
        getLeaderboard(courseId),
        getAllStudents(),
      ]);
      setConfig(configData);
      setPriorityStudents(priority || []);
      setLeaderboard(leader || []);
      setAllStudents(students || []);
      setSelectedStudents([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (mode: PresentationMode) => {
    if (!config) return;
    try {
      await setPresentationMode(courseId, mode, config.priority_limit, config.start_nomor_urut);
      setConfig({ ...config, mode });
      toast.success("Mode diubah");
    } catch (error) {
      toast.error("Gagal mengubah mode");
    }
  };

  const handleStartChange = async (value: string) => {
    setStartNomorUrut(value);
    const num = parseInt(value);
    if (!config || isNaN(num) || num < 1) return;
    try {
      await setPresentationMode(courseId, config.mode, config.priority_limit, num);
      setConfig({ ...config, start_nomor_urut: num });
    } catch (error) {
      toast.error("Gagal mengubah start");
    }
  };

  const handleCountChange = (value: string) => {
    setCountNomorUrut(value);
  };

  const handleBulkAddNomorUrut = async () => {
    const start = parseInt(startNomorUrut);
    const count = parseInt(countNomorUrut);

    if (isNaN(start) || start < 1) {
      toast.error("Start No harus angka positif");
      return;
    }
    if (isNaN(count) || count < 1) {
      toast.error("Jumlah harus angka positif");
      return;
    }

    const studentsToAdd = allStudents
      .filter(s => (s.nomor_urut || 0) >= start)
      .sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0))
      .slice(0, count);

    if (studentsToAdd.length === 0) {
      toast.error("Tidak ada mahasiswa dengan nomor urut tersebut");
      return;
    }

    await confirm({
      title: "Bulk Add",
      description: `Tambah ${studentsToAdd.length} mahasiswa (No. ${start} - ${studentsToAdd[studentsToAdd.length - 1].nomor_urut})?`,
      confirmText: "Tambah",
      onConfirm: async () => {
        try {
          for (const student of studentsToAdd) {
            await addPriorityStudent(courseId, student.user_id);
          }
          toast.success(`${studentsToAdd.length} mahasiswa ditambahkan`);
          loadData();
        } catch (error) {
          toast.error("Gagal bulk add");
        }
      },
    });
  };

  const handleBulkAddPrioritas = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    await confirm({
      title: "Bulk Add",
      description: `Tambah ${selectedStudents.length} mahasiswa ke priority?`,
      confirmText: "Tambah",
      onConfirm: async () => {
        try {
          for (const userId of selectedStudents) {
            await addPriorityStudent(courseId, userId);
          }
          toast.success(`${selectedStudents.length} mahasiswa ditambahkan`);
          setSelectedStudents([]);
          loadData();
        } catch (error) {
          toast.error("Gagal bulk add");
        }
      },
    });
  };

  const handleAccept = async (student: PriorityStudent) => {
    await confirm({
      title: "Accept",
      description: `${student.user_name} dapat 1 poin?`,
      confirmText: "Accept",
      onConfirm: async () => {
        // Optimistic: remove from local state immediately
        setPriorityStudents(prev => prev.filter(s => s.user_id !== student.user_id));

        try {
          await recordPresentation(courseId, student.user_id, student.user_name || "Presentation", 1);
          toast.success(`${student.user_name} dapat 1 poin`);

          // Update leaderboard
          const leader = await getLeaderboard(courseId);
          setLeaderboard(leader || []);
        } catch (error) {
          // Revert on error
          loadData();
          toast.error("Gagal accept");
        }
      },
    });
  };

  const handleReject = async (student: PriorityStudent) => {
    await confirm({
      title: "Hapus",
      description: `Hapus ${student.user_name} dari list?`,
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        // Optimistic: remove from local state immediately
        setPriorityStudents(prev => prev.filter(s => s.user_id !== student.user_id));

        try {
          await removePriorityStudent(courseId, student.user_id);
          toast.success("Dihapus dari list");
        } catch (error) {
          // Revert on error
          loadData();
          toast.error("Gagal");
        }
      },
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newList = [...priorityStudents];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setPriorityStudents(newList);
    try {
      await reorderPriorityStudents(courseId, newList.map(s => s.user_id));
    } catch (error) {
      loadData();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === priorityStudents.length - 1) return;
    const newList = [...priorityStudents];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setPriorityStudents(newList);
    try {
      await reorderPriorityStudents(courseId, newList.map(s => s.user_id));
    } catch (error) {
      loadData();
    }
  };

  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAll = () => {
    const notInList = allStudents
      .filter(s => !priorityStudents.some(p => p.user_id === s.user_id))
      .map(s => s.user_id);

    if (notInList.every(id => selectedStudents.includes(id))) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(notInList);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const notInPriority = allStudents
    .filter(s => !priorityStudents.some(p => p.user_id === s.user_id))
    .filter(s => !searchQuery || s.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.nomor_urut || 0) - (b.nomor_urut || 0));

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="mb-2 block">Mode</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={config?.mode || "prioritas"}
                  onChange={(e) => handleModeChange(e.target.value as PresentationMode)}
                >
                  <option value="prioritas">Prioritas</option>
                  <option value="nomor_urut">Nomor Urut</option>
                </select>
              </div>

              {config?.mode === "nomor_urut" && (
                <>
                  <div className="w-28">
                    <Label className="mb-2 block">Start No.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={startNomorUrut}
                      onChange={(e) => handleStartChange(e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="mb-2 block">Jumlah</Label>
                    <Input
                      type="number"
                      min="1"
                      value={countNomorUrut}
                      onChange={(e) => handleCountChange(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleBulkAddNomorUrut}>
                      <Plus className="h-4 w-4 mr-1" />
                      Bulk Add
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {config?.mode === "prioritas" ? (
                <>
                  <ChevronUp className="h-5 w-5" />
                  Priority ({priorityStudents.length})
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  Queue ({priorityStudents.length})
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Bulk Add for Prioritas Mode */}
            {config?.mode === "prioritas" && (
              <div className="mb-4 p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <Label>Pilih mahasiswa:</Label>
                  <Button size="sm" variant="outline" onClick={toggleAll}>
                    {selectedStudents.length === notInPriority.length ? "Unselect All" : "Select All"}
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Cari nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-3"
                />
                <div className="max-h-48 overflow-y-auto mb-3 border rounded">
                  {notInPriority.map(student => (
                    <label
                      key={student.user_id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted ${
                        selectedStudents.includes(student.user_id) ? "bg-primary/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.user_id)}
                        onChange={() => toggleStudent(student.user_id)}
                        className="rounded"
                      />
                      <span className="text-sm w-6">{student.nomor_urut || "-"}.</span>
                      <span className="text-sm font-medium">{student.user_name}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={handleBulkAddPrioritas} disabled={selectedStudents.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah {selectedStudents.length} ke Priority
                </Button>
              </div>
            )}

            {/* List Items */}
            {priorityStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                List kosong
              </p>
            ) : (
              <div className="space-y-2">
                {priorityStudents.map((student, index) => (
                  <div
                    key={student.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    {config?.mode === "prioritas" && (
                      <Badge variant="outline">{index + 1}</Badge>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{student.user_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        No. {student.nomor_urut || "-"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(student)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(student)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {config?.mode === "prioritas" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === priorityStudents.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Belum ada data
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        No. {entry.nomor_urut || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{entry.total_points} poin</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.total_shows}x
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
