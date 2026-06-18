'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Image as ImageIcon, X, Upload, Loader2, RefreshCw, GripVertical, ChevronLeft, ChevronRight, Maximize2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getBoardGalleryBySession,
  createBoardGalleryItem,
  deleteBoardGalleryItem,
  type BoardGalleryItem,
} from '@/lib/api/board-gallery';
import { EnhancedDocumentScanner, type ScanResult } from './EnhancedDocumentScanner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { canManageAcademic } from '@/lib/rbac';

interface LiveBoardGalleryProps {
  sessionId: number;
  courseId: number;
}

export function LiveBoardGallery({ sessionId, courseId }: LiveBoardGalleryProps) {
  const [items, setItems] = useState<BoardGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BoardGalleryItem | null>(null);
  const [uploadMode, setUploadMode] = useState<'scan' | 'form' | 'ninja'>('form');
  const ninjaUploadRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [uploading, setUploading] = useState(false);

  const { user, role } = useAuthStore();

  const loadItems = useCallback(async () => {
    try {
      const data = await getBoardGalleryBySession(sessionId);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load board gallery:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadItems();

    // Poll for updates every 5 seconds (real-time simulation)
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  }, [loadItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleScanComplete = async (result: ScanResult) => {
    setUploadMode('form');
    setImageUrl(result.processedImageData || result.imageData);
    setOcrText(result.ocrText);
    setTitle(`Board Photo - ${new Date().toLocaleTimeString('id-ID')}`);
  };

  // Ninja Upload: Quick upload with camera on mobile
  const handleNinjaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (ninjaUploadRef.current) {
      ninjaUploadRef.current.value = '';
    }

    setUploading(true);
    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        // Auto-generate title with timestamp
        const autoTitle = `Board Photo - ${new Date().toLocaleTimeString('id-ID')}`;

        await createBoardGalleryItem({
          session_id: sessionId,
          title: autoTitle,
          description: `Quick upload from ${courseId}`,
          image_url: base64Data,
          ocr_text: '',
          tags: [],
        });

        setUploading(false);
        await loadItems();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ninja upload failed:', error);
      setUploading(false);
    }
  };

  // Check if user can upload (KURIKULUM or SUPER_ADMIN only)
  const canUpload = user && role && canManageAcademic(role);

  const handleUpload = async () => {
    if (!title || !imageUrl) return;

    setUploading(true);
    try {
      await createBoardGalleryItem({
        session_id: sessionId,
        title,
        description,
        image_url: imageUrl,
        ocr_text: ocrText,
        tags: [],
      });

      // Reset form
      setTitle('');
      setDescription('');
      setImageUrl('');
      setOcrText('');
      setDialogOpen(false);

      // Reload items
      await loadItems();
    } catch (error) {
      console.error('Failed to upload board photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deleteBoardGalleryItem(id);
      await loadItems();
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete board photo:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Live Board Gallery
            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Live Board Gallery
          <Badge variant="secondary" className="ml-2">
            {items.length} photos
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Ninja Upload Button */}
          {canUpload && (
            <>
              <input
                ref={ninjaUploadRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleNinjaUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => ninjaUploadRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Quick Photo
              </Button>
            </>
          )}

          {canUpload && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Board Photo</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={uploadMode === 'form' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMode('form')}
                  >
                    Manual Upload
                  </Button>
                  <Button
                    variant={uploadMode === 'scan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMode('scan')}
                  >
                    Scan with Camera
                  </Button>
                </div>

                {/* Scan Mode */}
                {uploadMode === 'scan' && (
                  <EnhancedDocumentScanner
                    onScanComplete={handleScanComplete}
                    autoProcess={true}
                  />
                )}

                {/* Form Mode */}
                {uploadMode === 'form' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Board Photo - Session 1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's written on the board..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">Image URL *</Label>
                      <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    {ocrText && (
                      <div>
                        <Label htmlFor="ocrText">Extracted Text (OCR)</Label>
                        <Textarea
                          id="ocrText"
                          value={ocrText}
                          onChange={(e) => setOcrText(e.target.value)}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    {imageUrl && (
                      <div>
                        <Label>Preview</Label>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpload}
                        disabled={uploading || !title || !imageUrl}
                        className="flex-1"
                      >
                        {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Upload Photo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No board photos yet</p>
            <p className="text-sm">Upload photos to share with the class</p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal Carousel Container */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="flex gap-4 pb-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative group flex-shrink-0 w-64 aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay with info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-white/70 text-xs">
                          {new Date(item.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    {/* Delete button */}
                    {canUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* OCR indicator */}
                    {item.ocr_text && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-10 text-xs bg-blue-500 text-white"
                      >
                        OCR
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {items.length > 4 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: -300, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Image Detail Dialog (Lightbox) */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedItem.title}</span>
                  <div className="flex gap-2">
                    {canUpload && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(selectedItem.id)}
                      >
                        <X className="w-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Main Image with Lightbox */}
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>

                {/* Image Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Uploaded by</Label>
                    <p className="font-medium">{selectedItem.uploaded_by || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Uploaded on</Label>
                    <p className="font-medium">
                      {new Date(selectedItem.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {selectedItem.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-3 rounded-lg">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {selectedItem.ocr_text && (
                  <div>
                    <Label>Extracted Text (OCR)</Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-xs">
                        {selectedItem.ocr_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
