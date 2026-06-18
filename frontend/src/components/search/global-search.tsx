"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Calendar, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchLocal, buildSearchIndex, isSearchIndexed } from "@/lib/api/search";
import type { SearchResult } from "@/lib/api/search";
import { cn } from "@/lib/utils/cn";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build search index on mount
  useEffect(() => {
    if (!isSearchIndexed()) {
      buildSearchIndex();
    }
  }, []);

  // Search on query change
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const r = searchLocal(query);
    setResults(r.slice(0, 8));
    setSelectedIndex(0);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback(
    (result: SearchResult) => {
      setIsOpen(false);
      setQuery("");
      if (result.type === "course") {
        router.push(`/akademik/${result.course_id}`);
      } else if (result.type === "session") {
        router.push(
          `/akademik/${result.course_id}?session=${result.session_id}&tab=materi`
        );
      } else if (result.type === "task") {
        router.push(`/akademik/${result.course_id}?tab=tugas`);
      }
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex]);
    }
  }

  const iconMap = {
    course: BookOpen,
    session: Calendar,
    task: ClipboardList,
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Cari matkul, sesi, tugas... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full rounded-md border bg-popover shadow-md z-50 overflow-hidden"
        >
          {results.map((result, idx) => {
            const Icon = iconMap[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => navigate(result)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent transition-colors",
                  idx === selectedIndex && "bg-accent"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full rounded-md border bg-popover shadow-md z-50 p-4"
        >
          <p className="text-sm text-muted-foreground text-center">
            Tidak ada hasil untuk &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
