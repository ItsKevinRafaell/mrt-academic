"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/lib/hooks/use-fullscreen";
import { submitExam } from "@/lib/api/questions";
import type { Question } from "@/types";

interface ExamModeProps {
  question: Question;
  onClose: () => void;
}

export function ExamMode({ question, onClose }: ExamModeProps) {
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(
    (question.time_limit_minutes || 30) * 60
  );
  const [timeExpired, setTimeExpired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number } | null>(
    null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    return () => {
      exitFullscreen();
    };
  }, [enterFullscreen, exitFullscreen]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (key: string) => {
    if (submitted) return;
    setAnswers((prev) => {
      const newAnswers: Record<string, boolean> = {};
      // single select
      newAnswers[key] = true;
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalTime =
      (question.time_limit_minutes || 30) * 60 - timeLeft;
    try {
      const result = await submitExam(question.id, {
        user_id: "",
        answers: Object.entries(answers).map(([key, selected]) => ({
          option_key: key,
          selected,
        })),
        time_spent_seconds: totalTime,
        submitted_at: new Date().toISOString(),
      });
      setScore(result);
    } catch {
      setScore({ score: 0, total: question.options.length });
    }
    setSubmitted(true);
  };

  const handleClose = () => {
    exitFullscreen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Time expired banner */}
      {timeExpired && !submitted && (
        <div className="sticky top-0 z-10 bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">
            Waktu Habis! Silakan selesaikan dan kumpulkan jawaban Anda.
          </span>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{question.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg ${
              timeExpired
                ? "bg-red-100 text-red-700"
                : timeLeft < 60
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-primary/10 text-primary"
            }`}
          >
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>

          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        {submitted && score ? (
          <div className="text-center space-y-6 py-12">
            <div className="text-6xl font-bold text-primary">
              {score.score}/{score.total}
            </div>
            <p className="text-xl text-muted-foreground">
              {score.score === score.total
                ? "Sempurna! 🎉"
                : score.score >= score.total * 0.7
                  ? "Bagus! Terus berlatih!"
                  : "Terus berlatih, kamu pasti bisa!"}
            </p>
            <Button onClick={handleClose} size="lg">
              Selesai
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Question text */}
            <div>
              <p className="text-lg leading-relaxed">
                {question.question_text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option) => {
                const isSelected = answers[option.key];
                return (
                  <button
                    key={option.key}
                    onClick={() => handleSelectOption(option.key)}
                    className={`w-full text-left rounded-lg border-2 p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        }`}
                      >
                        {option.key}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={Object.keys(answers).length === 0}
              >
                Kumpulkan Jawaban
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
