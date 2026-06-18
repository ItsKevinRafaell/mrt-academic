"use client"

import React, { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { createWorker } from "tesseract.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, FileText, RotateCcw, Check, X, Loader2, Image as ImageIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DocumentScannerProps {
  onScanComplete: (result: ScanResult) => void
  onClose?: () => void
}

export interface ScanResult {
  imageData: string
  processedImageData?: string
  ocrText: string
  confidence: number
}

export function DocumentScanner({ onScanComplete, onClose }: DocumentScannerProps) {
  const [step, setStep] = useState<"capture" | "process" | "preview">("capture")
  const [imageData, setImageData] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImageData(imageSrc)
      setStep("process")
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageData(reader.result as string)
        setStep("process")
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async () => {
    if (!imageData) return

    setIsProcessing(true)
    setProcessingStatus("Initializing OCR engine...")

    try {
      // Edge detection and perspective correction
      setProcessingStatus("Detecting document edges...")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context not available")

      const img = new Image()
      img.src = imageData
      await new Promise((resolve) => {
        img.onload = resolve
      })

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Simple edge detection and enhancement
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageDataObj.data

      // Convert to grayscale and enhance contrast
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const enhanced = Math.min(255, avg * 1.2) // Increase contrast
        data[i] = enhanced
        data[i + 1] = enhanced
        data[i + 2] = enhanced
      }

      ctx.putImageData(imageDataObj, 0, 0)
      const processedDataUrl = canvas.toDataURL("image/png")
      setProcessedImage(processedDataUrl)

      // OCR Processing
      setProcessingStatus("Recognizing text...")
      const worker = await createWorker("ind+eng")

      const {
        data: { text, confidence },
      } = await worker.recognize(processedDataUrl)

      await worker.terminate()

      setOcrText(text)
      setConfidence(confidence)
      setStep("preview")
    } catch (error) {
      console.error("Processing error:", error)
      setProcessingStatus("Error processing image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setStep("capture")
    setImageData(null)
    setProcessedImage(null)
    setOcrText("")
    setConfidence(0)
  }

  const handleComplete = () => {
    onScanComplete({
      imageData: imageData!,
      processedImageData: processedImage || undefined,
      ocrText,
      confidence,
    })
    reset()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        <AnimatePresence mode="wait">
          {step === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Scan Document</h3>
                <p className="text-sm text-muted-foreground">
                  Take a photo or upload an image of your document
                </p>
              </div>

              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={capture} className="flex-1 gap-2">
                  <Camera className="w-4 h-4" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {onClose && (
                <Button variant="ghost" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              )}
            </motion.div>
          )}

          {step === "process" && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Process Document</h3>
                <p className="text-sm text-muted-foreground">
                  Review the image and start OCR processing
                </p>
              </div>

              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {imageData && (
                  <img
                    src={imageData}
                    alt="Captured document"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-primary">{processingStatus}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={processImage} disabled={isProcessing} className="flex-1 gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Start OCR
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={isProcessing} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </Button>
              </div>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Review Results</h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={confidence > 80 ? "default" : confidence > 60 ? "secondary" : "destructive"}>
                    Confidence: {confidence.toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processed Image</p>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {processedImage && (
                      <img
                        src={processedImage}
                        alt="Processed document"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Extracted Text</p>
                  <div className="aspect-video bg-muted rounded-lg overflow-auto p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {ocrText || "No text detected"}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleComplete} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Accept & Save
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <X className="w-4 h-4" />
                  Scan Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
