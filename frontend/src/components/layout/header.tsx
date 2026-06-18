"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/search/global-search";
import { OfflineBadge } from "@/components/offline-badge";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, role, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* App name - visible on mobile */}
      <Link
        href="/dashboard"
        className="text-lg font-bold text-primary md:hidden"
      >
        MRT
      </Link>

      {/* Global Search */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <OfflineBadge />

        {role && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {ROLE_LABELS[role]}
          </Badge>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.nim}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Keluar">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
