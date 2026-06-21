"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Calendar, Calculator, FileText, ClipboardList, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: any;
  href: string;
  category: "page" | "course" | "session" | "task" | "material";
}

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch search results from API
  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { getCourses } = await import("@/lib/api/courses");
      const { getTasks } = await import("@/lib/api/tasks");

      const courses = await getCourses();
      const tasksResults = await Promise.all(
        courses.slice(0, 5).map((c: any) => getTasks(c.id).catch(() => []))
      );
      const allTasks = tasksResults.flat();

      const results: SearchItem[] = [];
      const q = query.toLowerCase();

      // Search courses
      courses.forEach((course: any) => {
        if (
          course.name.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q)
        ) {
          results.push({
            id: `course-${course.id}`,
            label: course.name,
            sublabel: `${course.code} • ${course.sks} SKS`,
            icon: BookOpen,
            href: `/akademik/${course.id}`,
            category: "course",
          });
        }
      });

      // Search tasks
      allTasks.forEach((task: any) => {
        if (task.title?.toLowerCase().includes(q)) {
          results.push({
            id: `task-${task.id}`,
            label: task.title,
            sublabel: `Deadline: ${new Date(task.deadline).toLocaleDateString("id-ID")}`,
            icon: ClipboardList,
            href: `/akademik/${task.course_id}?tab=tugas`,
            category: "task",
          });
        }
      });

      setItems(results.slice(0, 10));
    } catch (error) {
      console.error("Search failed:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchSearchResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setSearch("");
      }

      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev
          );
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }

        if (e.key === "Enter" && items[selectedIndex]) {
          e.preventDefault();
          handleSelect(items[selectedIndex]);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, items, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    router.push(item.href);
    setOpen(false);
    setSearch("");
  };

  if (!open) return null;

  const categoryLabels: Record<string, string> = {
    page: "Halaman",
    course: "Mata Kuliah",
    session: "Sesi",
    task: "Tugas",
    material: "Materi",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          setSearch("");
        }}
      />

      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 animate-scale-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah, tugas, sesi..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              autoFocus
            />
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Searching...
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {items.length === 0 && search.trim() ? (
              <div className="py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada hasil ditemukan
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Ketik untuk mencari...
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                      index === selectedIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-xs text-muted-foreground">
                          {item.sublabel}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    {index === selectedIndex && (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        Enter
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  Enter
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  Esc
                </kbd>
                Close
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length} results
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
