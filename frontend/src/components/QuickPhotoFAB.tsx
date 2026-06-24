'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { useCurrentClass } from '@/hooks/use-current-class';
import { useCreateBoardGalleryItemForTopic } from '@/lib/api/board-gallery';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function QuickPhotoFAB() {
  const { currentClass, isLive, isLoading } = useCurrentClass();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateBoardGalleryItemForTopic(currentClass?.topic_id || 0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  if (isLoading || !currentClass || !currentClass.topic_id) return null;

  const handleFileSelect = async (file: File) => {
    if (!currentClass?.topic_id) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd HH:mm');
        const autoTitle = `${dateStr} - ${currentClass.course_code}`;

        await createMutation.mutateAsync({
          topic_id: currentClass.topic_id,
          title: autoTitle,
          description: `Quick upload: ${currentClass.course_name}`,
          image_url: base64Data,
          ocr_text: '',
          tags: ['quick-photo'],
        });

        setUploadStatus('success');
        setTimeout(() => {
          setUploadStatus('idle');
          setIsUploading(false);
        }, 2000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Quick photo upload failed:', error);
      setUploadStatus('error');
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      e.target.value = '';
    }
  };

  const handleCameraClick = () => {
    if (!isMobile) {
      alert('Kamera hanya tersedia di perangkat mobile. Gunakan tombol Galeri untuk upload foto.');
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded Dialog */}
        {isOpen && (
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 w-72 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-sm font-semibold">{currentClass.course_code}</span>
              </div>
              <button onClick={() => { setIsOpen(false); setUploadStatus('idle'); }} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Course Info */}
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium">{currentClass.course_name}</p>
              {currentClass.topic_title && (
                <p className="text-xs text-muted-foreground mt-1">{currentClass.topic_title}</p>
              )}
              {currentClass.session_number && (
                <p className="text-xs text-muted-foreground">Sesi {currentClass.session_number}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {currentClass.start_time} - {currentClass.end_time}
                {isLive && (
                  <span className="text-green-600 font-medium ml-1">
                    ({currentClass.time_left_minutes} min lagi)
                  </span>
                )}
              </p>
            </div>

            {/* Upload Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCameraClick}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : uploadStatus === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">Kamera</span>
              </button>
              <button
                onClick={handleGalleryClick}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Galeri</span>
              </button>
            </div>

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <p className="text-xs text-green-600 mt-2 text-center font-medium">✓ Foto berhasil diupload!</p>
            )}
            {uploadStatus === 'error' && (
              <p className="text-xs text-destructive mt-2 text-center font-medium">✗ Upload gagal, coba lagi</p>
            )}

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* FAB Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110 hover:shadow-xl
            ${isLive
              ? 'bg-primary text-white ring-2 ring-green-500/50'
              : 'bg-muted text-muted-foreground border border-border'
            }
          `}
          title={`Quick Photo — ${currentClass.course_name}`}
        >
          <Camera className="h-6 w-6" />
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm border border-border">
            Quick Photo — {currentClass.course_code}
          </div>
        </button>
      </div>
    </>
  );
}
