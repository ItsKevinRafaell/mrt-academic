"use client";
import { useCallback, useState } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      console.warn("Fullscreen request denied — must be triggered by user gesture");
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      console.warn("Failed to exit fullscreen");
    }
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen };
}
