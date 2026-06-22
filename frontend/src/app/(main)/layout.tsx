"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandBar } from "@/components/command-bar";
import { CawuSwitcher } from "@/components/cawu-switcher";
import { Search } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Loader2 } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuthStore();

  // Show loading while auth hydrates from localStorage
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - collapsible */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:z-auto
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <CawuSwitcher />
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
              });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-200 text-sm text-muted-foreground max-w-md w-full ml-auto"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Cari mata kuliah, sesi...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </header>

        {/* Main content - fills remaining space */}
        <main className="flex-1 overflow-y-auto p-4 pt-12 lg:p-8 lg:pt-6">{children}</main>
      </div>

      {/* Command Bar (Ctrl+K) */}
      <CommandBar />
    </div>
  );
}
