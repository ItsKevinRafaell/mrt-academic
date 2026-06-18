"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  caption?: string;
  prevImageUrl?: string;
  nextImageUrl?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox({
  open,
  onClose,
  imageUrl,
  title,
  caption,
  prevImageUrl,
  nextImageUrl,
  onPrev,
  onNext,
}: LightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev && prevImageUrl) onPrev();
      if (e.key === "ArrowRight" && onNext && nextImageUrl) onNext();
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, onPrev, onNext, prevImageUrl, nextImageUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation Buttons */}
      {prevImageUrl && onPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={onPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {nextImageUrl && onNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Image Container */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4">
        <img
          src={imageUrl}
          alt={title || "Photo"}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Caption */}
        {(title || caption) && (
          <div className="text-center text-white max-w-2xl">
            {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
            {caption && <p className="text-sm text-white/80">{caption}</p>}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
