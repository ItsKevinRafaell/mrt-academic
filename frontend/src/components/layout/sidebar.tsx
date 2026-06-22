"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  Settings,
  Calendar,
  Users,
  ClipboardList,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROUTES } from "@/lib/constants/routes";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, role, logout } = useAuthStore();

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Main navigation items (visible to all roles)
  const mainNav: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: ROUTES.DASHBOARD,
    },
    {
      icon: BookOpen,
      label: "Akademik",
      href: ROUTES.AKADEMIK,
    },
    {
      icon: ClipboardList,
      label: "Tugas",
      href: "/tugas",
    },
    {
      icon: Calendar,
      label: "Kalender",
      href: "/calendar",
    },
    {
      icon: Calculator,
      label: "Kalkulator IPK",
      href: ROUTES.IPK,
    },
    {
      icon: NotebookPen,
      label: "Catatan Saya",
      href: "/catatan",
    },
  ];

  // Bank Soal is NOT in sidebar - it should be accessed from within course detail page

  // Admin navigation items (conditional based on role)
  // NOTE: Manajemen Akademik is now integrated into /akademik for KURIKULUM
  // Monitoring is now inline in task cards (no separate page)
  const adminNav: NavItem[] = [];

  // SEKRETARIS and SUPER_ADMIN can manage calendar/schedule
  if (role === "SEKRETARIS" || role === "SUPER_ADMIN") {
    adminNav.push({
      icon: Calendar,
      label: "Manajemen Kalender",
      href: "/admin/calendar",
    });
  }

  // SUPER_ADMIN can manage users
  if (role === "SUPER_ADMIN") {
    adminNav.push({
      icon: Users,
      label: "Manajemen Warga",
      href: ROUTES.ADMIN_USERS,
    });
  }

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD;
    }
    return pathname.startsWith(href);
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);

    const button = (
      <Link
        href={item.href}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        "lg:h-screen h-full"
      )}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                M
              </span>
            </div>
            <span className="font-bold text-foreground">MRT Academic</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 sm:hidden"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "flex-col gap-2"
          )}
        >
          <Avatar className={cn("h-10 w-10", collapsed && "h-12 w-12")}>
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 text-xs font-medium"
              >
                {role}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Menu */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Menu
            </p>
          )}
          {mainNav.map((item) => (
            <NavButton key={item.href} item={item} />
          ))}
        </div>

        {/* Admin Menu (if applicable) */}
        {adminNav.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </p>
            )}
            {adminNav.map((item) => (
              <NavButton key={item.href} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
