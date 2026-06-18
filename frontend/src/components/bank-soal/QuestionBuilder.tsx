"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, Image as ImageIcon, Link2 } from "lucide-react";
import { createQuestion } from "@/lib/api/questions";
import { useToast } from "@/components/ui/use-toast";

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  image_url?: string;
}

export function QuestionBuilder({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState<"multiple_choice" | "fill_blank">("multiple_choice");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [tags, setTags] = useState("");
  const [explanation, setExplanation] = useState("");

  // Multiple choice specific
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: "1", text: "", is_correct: false },
    { id: "2", text: "", is_correct: false },
    { id: "3", text: "", is_correct: false },
    { id: "4", text: "", is_correct: false },
  ]);

  // Fill in the blank specific
  const [correctAnswer, setCorrectAnswer] = useState("");

  // Common fields
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");

  const imageInputRef = useRef<HTMLInputElement>(null);

  const addOption = () => {
    setOptions([
      ...options,
      { id: Date.now().toString(), text: "", is_correct: false },
    ]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const toggleCorrect = (id: string) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        is_correct: opt.id === id,
      }))
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "question" | "option", optionId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === "question") {
        setQuestionImage(base64);
      } else if (target === "option" && optionId) {
        setOptions(
          options.map((opt) =>
            opt.id === optionId ? { ...opt, image_url: base64 } : opt
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const questionData: any = {
        question_text: questionText,
        question_type: questionType,
        difficulty,
        course_id: parseInt(courseId),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        explanation,
      };

      if (questionImage) {
        questionData.image_url = questionImage;
      }

      if (questionType === "multiple_choice") {
        const validOptions = options.filter((opt) => opt.text.trim());
        if (validOptions.length < 2) {
          throw new Error("Minimal 2 opsi jawaban harus diisi");
        }
        const hasCorrect = validOptions.some((opt) => opt.is_correct);
        if (!hasCorrect) {
          throw new Error("Pilih salah satu jawaban yang benar");
        }
        questionData.options = validOptions;
      } else {
        if (!correctAnswer.trim()) {
          throw new Error("Jawaban benar harus diisi");
        }
        questionData.correct_answer = correctAnswer;
      }

      await createQuestion(questionData);
      toast({
        title: "Berhasil",
        description: "Pertanyaan berhasil ditambahkan",
      });
      onSuccess();

      // Reset form
      setQuestionText("");
      setQuestionImage("");
      setExplanation("");
      setTags("");
      setCourseId("");
      setCorrectAnswer("");
      setOptions([
        { id: "1", text: "", is_correct: false },
        { id: "2", text: "", is_correct: false },
        { id: "3", text: "", is_correct: false },
        { id: "4", text: "", is_correct: false },
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan pertanyaan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course_id">Mata Kuliah</Label>
              <Input
                id="course_id"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="ID Mata Kuliah"
                required
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Mudah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="hard">Sulit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="contoh: pemrograman, dasar, algoritma"
            />
          </div>

          <div>
            <Label htmlFor="question_type">Tipe Pertanyaan</Label>
            <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                <SelectItem value="fill_blank">Isian Singkat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pertanyaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question_text">Teks Pertanyaan</Label>
            <Textarea
              id="question_text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tulis pertanyaan di sini..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Gambar Pertanyaan (Opsional)</Label>
            <div className="flex items-center gap-4">
              {questionImage && (
                <img
                  src={questionImage}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "question")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {questionImage ? "Ganti Gambar" : "Upload Gambar"}
              </Button>
              {questionImage && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setQuestionImage("")}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {questionType === "multiple_choice" ? (
        <Card>
          <CardHeader>
            <CardTitle>Opsi Jawaban</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <div key={option.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={option.is_correct}
                    onCheckedChange={() => toggleCorrect(option.id)}
                    id={`correct-${option.id}`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                        required
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(option.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {option.image_url && (
                      <img
                        src={option.image_url}
                        alt="Option"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`option-image-${option.id}`}
                        onChange={(e) => handleImageUpload(e, "option", option.id)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById(`option-image-${option.id}`)?.click()
                        }
                      >
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Gambar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOption}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Opsi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jawaban Benar</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="correct_answer">Jawaban</Label>
              <Input
                id="correct_answer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Masukkan jawaban yang benar"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Penjelasan (Opsional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="explanation">Penjelasan Jawaban</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Jelaskan mengapa jawaban ini benar..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pertanyaan"}
        </Button>
      </div>
    </form>
  );
}
