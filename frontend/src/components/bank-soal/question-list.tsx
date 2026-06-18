"use client";
import { useState } from "react";
import { ExternalLink, Play, FileText, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types";
import { ExamMode } from "./exam-mode";

interface QuestionListProps {
  questions: Question[];
  courseId: number;
}

export function QuestionList({ questions, courseId }: QuestionListProps) {
  const [activeExam, setActiveExam] = useState<Question | null>(null);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Belum ada bank soal untuk matkul ini
          </p>
        </CardContent>
      </Card>
    );
  }

  const difficultyColor = (level: string) => {
    switch (level) {
      case "easy":
        return "success" as const;
      case "medium":
        return "secondary" as const;
      case "hard":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const difficultyLabel = (level: string) => {
    switch (level) {
      case "easy":
        return "Mudah";
      case "medium":
        return "Sedang";
      case "hard":
        return "Sulit";
      default:
        return level;
    }
  };

  return (
    <>
      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={difficultyColor(q.difficulty_level)}>
                      {difficultyLabel(q.difficulty_level)}
                    </Badge>
                    <Badge variant="outline">
                      {q.type === "exam" ? "Simulasi Ujian" : "Soal Reguler"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {q.question_text}
                  </p>
                  {q.time_limit_minutes && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{q.time_limit_minutes} menit</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {q.type === "exam" ? (
                    <Button
                      onClick={() => setActiveExam(q)}
                      className="gap-2"
                      size="sm"
                    >
                      <Play className="h-4 w-4" />
                      Mulai
                    </Button>
                  ) : q.external_url ? (
                    <Button asChild size="sm" className="gap-2">
                      <a
                        href={q.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeExam && (
        <ExamMode
          question={activeExam}
          onClose={() => setActiveExam(null)}
        />
      )}
    </>
  );
}
