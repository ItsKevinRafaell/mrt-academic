"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Simulation, SimulationQuestion } from "@/types/bank-soal";

interface CBTSimulatorProps {
  simulation: Simulation;
  onComplete: (score: number, answers: Record<number, string>) => void;
}

export function CBTSimulator({ simulation, onComplete }: CBTSimulatorProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(simulation.duration_minutes * 60);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const questions = simulation.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && !showResults) {
      handleSubmit();
    }
  }, [timeRemaining, showResults]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function handleAnswerChange(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }

  function goToPrevQuestion() {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  }

  function goToNextQuestion() {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }

  function handleSubmit() {
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((q) => {
      maxScore += q.points;
      if (q.question_type === "multiple_choice" && q.correct_answer) {
        const userAnswer = answers[q.id];
        if (userAnswer === q.correct_answer) {
          totalScore += q.points;
        }
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    setScore(percentage);
    setShowResults(true);
    onComplete(percentage, answers);
  }

  function parseOptions(optionsString?: string): string[] {
    if (!optionsString) return [];
    try {
      return JSON.parse(optionsString);
    } catch {
      return [];
    }
  }

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Simulasi Selesai!</h2>
            <p className="text-muted-foreground">{simulation.title}</p>
            <div className="text-4xl font-bold text-primary">{score}%</div>
            <p className="text-sm text-muted-foreground">
              Skor otomatis untuk soal pilihan ganda. Soal essay perlu dinilai manual.
            </p>
            <Button onClick={() => window.location.reload()}>Kembali ke Daftar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isTimeWarning = timeRemaining < 300;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{simulation.title}</h2>
              <p className="text-sm text-muted-foreground">
                Soal {currentQuestionIndex + 1} dari {questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isTimeWarning ? "text-red-500" : ""}`}>
              <Clock className="h-5 w-5" />
              <span className="text-lg font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="font-semibold text-lg">{currentQuestion.question_text}</div>

          {currentQuestion.question_type === "multiple_choice" ? (
            <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={handleAnswerChange}>
              {parseOptions(currentQuestion.options).map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Tulis jawaban Anda di sini..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="min-h-[200px]"
            />
          )}

          <div className="text-sm text-muted-foreground">Poin: {currentQuestion.points}</div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrevQuestion} disabled={currentQuestionIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Sebelumnya
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={() => setShowConfirmDialog(true)}>Selesai & Submit</Button>
        ) : (
          <Button onClick={goToNextQuestion}>
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Submit</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyelesaikan simulasi ini? Jawaban tidak dapat diubah setelah submit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
