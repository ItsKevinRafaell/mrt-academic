"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open = false,
  onOpenChange,
  title = "Konfirmasi",
  description = "Apakah Anda yakin?",
  confirmText = "Ya",
  cancelText = "Batal",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for simple confirmation
export function useConfirm() {
  const [config, setConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "Konfirmasi",
    description: "Apakah Anda yakin?",
    confirmText: "Ya",
    variant: "default",
    onConfirm: () => {},
  });

  const confirm = async (options: {
    title?: string;
    description?: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        open: true,
        title: options.title || "Konfirmasi",
        description: options.description || "Apakah Anda yakin?",
        confirmText: options.confirmText || "Ya",
        variant: options.variant || "default",
        onConfirm: async () => {
          await options.onConfirm();
          resolve(true);
        },
      });
    });
  };

  const ConfirmDialogComponent = () => (
    <Dialog
      open={config.open}
      onOpenChange={(open) => !open && setConfig((c) => ({ ...c, open: false }))}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setConfig((c) => ({ ...c, open: false }))}
          >
            {config.confirmText === "Hapus" ? "Batal" : "Tidak"}
          </Button>
          <Button
            variant={config.variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              config.onConfirm();
              setConfig((c) => ({ ...c, open: false }));
            }}
          >
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
