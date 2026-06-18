"use client";
import { useEffect } from "react";
import { useOfflineStore } from "@/lib/stores/offline-store";

export function useOffline() {
  const { isOnline, setOnline } = useOfflineStore();

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  return isOnline;
}
