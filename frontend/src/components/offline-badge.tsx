"use client";
import { useOffline } from "@/lib/hooks/use-offline";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OfflineBadge() {
  const isOnline = useOffline();

  if (isOnline) return null;

  return (
    <Badge variant="destructive" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Offline
    </Badge>
  );
}
