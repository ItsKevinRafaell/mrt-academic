'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, X, Check, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateBoardGalleryItem } from '@/lib/api/board-gallery';

interface QuickCaptureProps {
  sessionId: number;
  courseId: number;
  onSuccess?: () => void;
}

// Compress image to reduce upload size (max 800px, 70% quality)
function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let { width, height } = img;

        if (width > height && width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getPhotoTitle() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} ${timeStr} - Board Photo`;
}

export function QuickCapture({ sessionId, courseId, onSuccess }: QuickCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedData, setCompressedData] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [burstMode, setBurstMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateBoardGalleryItem();

  const handleCapture = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';

    setCapturing(true);
    try {
      const { dataUrl } = await compressImage(file);
      setPreview(dataUrl);
      setCompressedData(dataUrl);
    } catch (err) {
      console.error('Failed to compress:', err);
      // Fallback: use original
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
        setCompressedData(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setCapturing(false);
    }
  };

  const handleUpload = async () => {
    if (!compressedData) return;
    setUploading(true);
    try {
      await createMutation.mutateAsync({
        session_id: sessionId,
        title: getPhotoTitle(),
        description: `Quick capture from ${courseId}`,
        image_url: compressedData,
        ocr_text: '',
        tags: [],
      });
      setPreview(null);
      setCompressedData(null);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to upload:', err);
      alert('Gagal upload foto');
    } finally {
      setUploading(false);
    }
  };

  // If preview shown, show confirm/cancel
  if (preview) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-black">
          <button
            onClick={() => { setPreview(null); setCompressedData(null); }}
            className="p-2 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-white text-sm font-medium">Review Foto</span>
          <button
            onClick={() => { setPreview(null); setCompressedData(null); handleCapture(); }}
            className="p-2 text-white"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-center gap-6 p-6 bg-black">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            <span className="ml-2">{uploading ? 'Upload...' : 'Upload'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // Camera trigger button
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <Button
        size="lg"
        variant="default"
        onClick={handleCapture}
        disabled={capturing || uploading}
        className="gap-2 h-12 px-6 text-base"
      >
        {capturing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
        {capturing ? 'Processing...' : 'Quick Photo'}
      </Button>
    </>
  );
}
