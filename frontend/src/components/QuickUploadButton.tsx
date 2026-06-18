"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { getActiveSchedule } from "@/lib/api/schedules";
import { createMaterial } from "@/lib/api/materials";

interface QuickUploadButtonProps {
  onUploadSuccess?: () => void;
}

export function QuickUploadButton({ onUploadSuccess }: QuickUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const activeSchedules = await getActiveSchedule();

      if (!activeSchedules || activeSchedules.length === 0) {
        alert("Tidak ada kelas yang sedang berlangsung saat ini");
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const schedule = activeSchedules[0];

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;

          await createMaterial({
            session_id: schedule.session_id || 0,
            title: `Foto Kelas - ${new Date().toLocaleString("id-ID")}`,
            type: "image",
            url: base64,
            description: `Foto dari kelas ${schedule.course_name}`,
          });

          alert(`Upload berhasil untuk ${schedule.course_name}!`);
          onUploadSuccess?.();
        } catch (error) {
          console.error("Upload error:", error);
          alert("Gagal mengupload materi");
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error getting active schedule:", error);
      alert("Gagal mendapatkan jadwal aktif");
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={uploading}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center md:hidden hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed z-50"
        aria-label="Quick upload"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
