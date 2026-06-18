"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Calendar, Calculator, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  category: "subject" | "page" | "session";
}

// Dummy data - will be replaced with API calls later
const COMMAND_ITEMS: CommandItem[] = [
  // Pages
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Calculator,
    href: "/dashboard",
    category: "page",
  },
  {
    id: "akademik",
    label: "Akademik",
    icon: BookOpen,
    href: "/akademik",
    category: "page",
  },
  {
    id: "ipk",
    label: "Kalkulator IPK",
    icon: Calculator,
    href: "/ipk",
    category: "page",
  },
  {
    id: "kalender",
    label: "Kalender Akademik",
    icon: Calendar,
    href: "/kalender",
    category: "page",
  },
  // Dummy subjects
  {
    id: "progweb",
    label: "Pemrograman Web",
    icon: BookOpen,
    href: "/akademik/1",
    category: "subject",
  },
  {
    id: "basisdata",
    label: "Basis Data",
    icon: BookOpen,
    href: "/akademik/2",
    category: "subject",
  },
  {
    id: "jarkom",
    label: "Jaringan Komputer",
    icon: BookOpen,
    href: "/akademik/3",
    category: "subject",
  },
  {
    id: "sistop",
    label: "Sistem Operasi",
    icon: BookOpen,
    href: "/akademik/4",
    category: "subject",
  },
  {
    id: "ai",
    label: "Kecerdasan Buatan",
    icon: BookOpen,
    href: "/akademik/5",
    category: "subject",
  },
  // Dummy sessions
  {
    id: "session1",
    label: "HTML & CSS Fundamentals",
    icon: FileText,
    href: "/akademik/1/sesi/1",
    category: "session",
  },
  {
    id: "session2",
    label: "JavaScript Basics",
    icon: FileText,
    href: "/akademik/1/sesi/2",
    category: "session",
  },
  {
    id: "session3",
    label: "React Components",
    icon: FileText,
    href: "/akademik/1/sesi/3",
    category: "session",
  },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Filter items based on search
  const filteredItems = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Open with Ctrl+K or Cmd+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Close with Escape
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }

      // Navigate with arrow keys
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }

        // Select with Enter
        if (e.key === "Enter" && filteredItems[selectedIndex]) {
          e.preventDefault();
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, filteredItems, selectedIndex]);

  const handleSelect = (item: CommandItem) => {
    router.push(item.href);
    setOpen(false);
    setSearch("");
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          setSearch("");
        }}
      />

      {/* Command Bar */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 animate-scale-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah, sesi, atau halaman..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tidak ada hasil ditemukan
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
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
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category}
                      </p>
                    </div>
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

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  Enter
                </kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 rounded border border-border bg-muted font-mono text-[10px]">
                  Esc
                </kbd>
                <span>Close</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredItems.length} results
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
