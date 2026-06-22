import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface CourseCardProps {
  id: number;
  name: string;
  code: string;
  sks: number;
  course_type?: string;
  cawu_id?: number;
  instructors?: string[];
  onClick?: () => void;
  className?: string;
}

export function CourseCard({
  id,
  name,
  code,
  sks,
  course_type,
  onClick,
  className,
}: CourseCardProps) {
  const content = (
    <Card
      className={cn(
        "p-6 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        {course_type && (
          <Badge variant="secondary" className="text-xs">
            {course_type === "lab" ? "Lab" : "Lecturer"}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{code}</span>
          <span>•</span>
          <span>{sks} SKS</span>
        </div>
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <div onClick={onClick}>
        {content}
      </div>
    );
  }

  return (
    <Link href={`/akademik/${id}`}>
      {content}
    </Link>
  );
}
