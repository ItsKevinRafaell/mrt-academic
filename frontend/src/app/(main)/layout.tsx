"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandBar } from "@/components/command-bar";
import { CawuSwitcher } from "@/components/cawu-switcher";
import { Search } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - collapsible */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Minimal top bar with command bar trigger and cawu switcher */}
        <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
          <CawuSwitcher />
          <button
            onClick={() => {
              // Trigger command bar with keyboard shortcut
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
              });
              document.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-200 text-sm text-muted-foreground max-w-md w-full ml-4"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Cari mata kuliah, sesi...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Main content - fills remaining space */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      {/* Command Bar (Ctrl+K) */}
      <CommandBar />
    </div>
  );
}
