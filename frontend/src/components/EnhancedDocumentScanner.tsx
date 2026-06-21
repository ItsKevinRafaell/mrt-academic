"use client"

import React, { useState, useRef, useCallback, lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, FileText, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface EnhancedDocumentScannerProps {
  onScanComplete: (result: ScanResult) => void
  onClose?: () => void
  autoProcess?: boolean
}

export interface ScanResult {
  imageData: string
  processedImageData?: string
  ocrText: string
  confidence: number
}

export function EnhancedDocumentScanner({ onScanComplete, onClose, autoProcess = false }: EnhancedDocumentScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play().catch(() => {})
        }
      }
      setHasCamera(true)
    } catch (err) {
      console.error("Camera error:", err)
      setHasCamera(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setHasCamera(null)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return

    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video not ready yet, retrying...")
      setTimeout(capturePhoto, 300)
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageData)
      stopCamera()
    }
  }, [stopCamera])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!capturedImage) return
    setIsUploading(true)

    onScanComplete({
      imageData: capturedImage,
      processedImageData: capturedImage,
      ocrText: "",
      confidence: 0,
    })
    setIsUploading(false)
    setCapturedImage(null)
    setTitle("")
  }

  // Clean up camera on unmount
  React.useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // No camera selected yet
  if (hasCamera === null) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-4">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Scan Document</p>
              <p className="text-sm text-muted-foreground">Ambil foto atau upload file</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={startCamera} className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Buka Kamera
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>
    )
  }

  // Camera active
  if (hasCamera === true && !capturedImage) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={capturePhoto} className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Ambil Foto
            </Button>
            <Button variant="outline" onClick={stopCamera} className="gap-2">
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Camera not available
  if (hasCamera === false) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-4">
            <Camera className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium">Kamera tidak tersedia</p>
              <p className="text-sm text-muted-foreground">Upload file sebagai alternatif</p>
            </div>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>
    )
  }

  // Photo captured - preview
  if (capturedImage) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Gunakan Foto Ini
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null)
                startCamera()
              }}
              className="gap-2"
            >
              Ambil Ulang
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
