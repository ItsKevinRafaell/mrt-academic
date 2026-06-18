"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Eye,
} from "lucide-react";
import type { Question, QuestionType, DifficultyLevel } from "@/types";
import { deleteQuestion } from "@/lib/api/questions";

interface QuestionListProps {
  questions: Question[];
  courseId: number;
  onEdit: (question: Question) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

export function QuestionList({ questions, courseId, onEdit, onAdd, onRefresh }: QuestionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [questionToPreview, setQuestionToPreview] = useState<Question | null>(null);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || q.type === filterType;
    const matchesDifficulty = filterDifficulty === "all" || q.difficulty_level === filterDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteClick = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    setDeleting(true);
    try {
      await deleteQuestion(questionToDelete.id);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Gagal menghapus pertanyaan");
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewClick = (question: Question) => {
    setQuestionToPreview(question);
    setPreviewDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterDifficulty("all");
    setCurrentPage(1);
  };

  const getDifficultyBadgeColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getDifficultyLabel = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy":
        return "Mudah";
      case "medium":
        return "Sedang";
      case "hard":
        return "Sulit";
    }
  };

  const getTypeBadgeColor = (type: QuestionType) => {
    return type === "regular"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getTypeLabel = (type: QuestionType) => {
    return type === "regular" ? "Reguler" : "Ujian";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Soal</h2>
          <p className="text-muted-foreground">
            Kelola pertanyaan untuk latihan dan ujian
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pertanyaan
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>

            <Select value={filterType} onValueChange={(v) => {
              setFilterType(v as QuestionType | "all");
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="regular">Reguler</SelectItem>
                <SelectItem value="exam">Ujian</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDifficulty} onValueChange={(v) => {
              setFilterDifficulty(v as DifficultyLevel | "all");
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                <SelectItem value="easy">Mudah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="hard">Sulit</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterType !== "all" || filterDifficulty !== "all") && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Menampilkan {filteredQuestions.length} dari {questions.length} pertanyaan
            </span>
          </div>
        </div>
      </Card>

      {/* Question List */}
      {filteredQuestions.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {questions.length === 0 ? "Belum Ada Pertanyaan" : "Tidak Ada Hasil"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {questions.length === 0
              ? "Mulai tambahkan pertanyaan untuk membuat bank soal"
              : "Coba ubah filter atau kata kunci pencarian"}
          </p>
          {questions.length === 0 && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pertanyaan Pertama
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedQuestions.map((question) => (
            <Card key={question.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {question.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {question.question_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={getDifficultyBadgeColor(question.difficulty_level)}>
                      {getDifficultyLabel(question.difficulty_level)}
                    </Badge>
                    <Badge variant="outline" className={getTypeBadgeColor(question.type)}>
                      {getTypeLabel(question.type)}
                    </Badge>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{question.options.length} pilihan</span>
                  </div>
                  {question.time_limit_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{question.time_limit_minutes} menit</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewClick(question)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(question)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(question)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pertanyaan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pertanyaan &ldquo;{questionToDelete?.title}&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Pertanyaan</DialogTitle>
            <DialogDescription>
              {questionToPreview?.title}
            </DialogDescription>
          </DialogHeader>

          {questionToPreview && (
            <div className="space-y-4">
              {/* Question Text */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium">{questionToPreview.question_text}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Pilihan Jawaban:</h4>
                {questionToPreview.options.map((option, index) => (
                  <div
                    key={option.key}
                    className={`p-3 rounded-lg border ${
                      option.key === questionToPreview.answer_key
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1">{option.text}</span>
                      {option.key === questionToPreview.answer_key && (
                        <Badge className="bg-green-600">Benar</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Badge variant="outline" className={getDifficultyBadgeColor(questionToPreview.difficulty_level)}>
                  {getDifficultyLabel(questionToPreview.difficulty_level)}
                </Badge>
                <Badge variant="outline" className={getTypeBadgeColor(questionToPreview.type)}>
                  {getTypeLabel(questionToPreview.type)}
                </Badge>
                {questionToPreview.time_limit_minutes && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {questionToPreview.time_limit_minutes} menit
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
