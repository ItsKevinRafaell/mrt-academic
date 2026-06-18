"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import Webcam from "react-webcam"
import { createWorker } from "tesseract.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, FileText, RotateCcw, Check, X, Loader2, Wand2, Crop } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  metadata?: {
    edges?: { x: number; y: number }[]
    perspectiveCorrected?: boolean
    contrast?: number
  }
}

// OpenCV.js will be loaded dynamically
declare global {
  interface Window {
    cv: any
  }
}

export function EnhancedDocumentScanner({ onScanComplete, onClose, autoProcess = true }: EnhancedDocumentScannerProps) {
  const [step, setStep] = useState<"capture" | "process" | "preview">("capture")
  const [imageData, setImageData] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [edgePreview, setEdgePreview] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("")
  const [opencvReady, setOpencvReady] = useState(false)
  const [enhancementLevel, setEnhancementLevel] = useState<"auto" | "low" | "medium" | "high">("auto")
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const cv = await import("@techstark/opencv-js")
        window.cv = cv
        setOpencvReady(true)
      } catch (error) {
        console.error("Failed to load OpenCV.js:", error)
      }
    }
    loadOpenCV()
  }, [])

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImageData(imageSrc)
      setStep("process")
      if (autoProcess) {
        setTimeout(() => processImage(imageSrc), 100)
      }
    }
  }, [autoProcess])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageData(reader.result as string)
        setStep("process")
        if (autoProcess) {
          setTimeout(() => processImage(reader.result as string), 100)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const detectEdges = (imageData: string): Promise<{ edges: { x: number; y: number }[]; preview: string }> => {
    return new Promise((resolve, reject) => {
      if (!window.cv) {
        reject(new Error("OpenCV not loaded"))
        return
      }

      const img = new Image()
      img.src = imageData
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }
        ctx.drawImage(img, 0, 0)

        const cv = window.cv
        const src = cv.imread(canvas)
        const gray = new cv.Mat()
        const edges = new cv.Mat()

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)

        // Apply Gaussian blur
        const ksize = new cv.Size(5, 5)
        cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT)

        // Canny edge detection
        cv.Canny(gray, edges, 50, 150)

        // Find contours
        const contours = new cv.MatVector()
        const hierarchy = new cv.Mat()
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

        // Find the largest contour (document)
        let maxArea = 0
        let largestContour = null
        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i)
          const area = cv.contourArea(contour)
          if (area > maxArea) {
            maxArea = area
            largestContour = contour
          }
        }

        // Approximate polygon for document corners
        let corners: { x: number; y: number }[] = []
        if (largestContour) {
          const approx = new cv.Mat()
          const peri = cv.arcLength(largestContour, true)
          cv.approxPolyDP(largestContour, approx, 0.02 * peri, true)

          // Extract corner points
          for (let i = 0; i < approx.rows; i++) {
            corners.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] })
          }
          approx.delete()
        }

        // Draw edges for preview
        const edgeCanvas = document.createElement("canvas")
        edgeCanvas.width = img.width
        edgeCanvas.height = img.height
        cv.imshow(edgeCanvas, edges)

        // Draw contour overlay
        if (largestContour) {
          const overlay = cv.imread(canvas)
          const color = new cv.Scalar(0, 255, 0, 255)
          cv.drawContours(overlay, contours, -1, color, 3)
          cv.imshow(edgeCanvas, overlay)
          overlay.delete()
        }

        const preview = edgeCanvas.toDataURL("image/png")

        // Cleanup
        src.delete()
        gray.delete()
        edges.delete()
        contours.delete()
        hierarchy.delete()
        if (largestContour) largestContour.delete()

        resolve({ edges: corners, preview })
      }
    })
  }

  const correctPerspective = (imageData: string, corners: { x: number; y: number }[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.cv || corners.length < 4) {
        resolve(imageData)
        return
      }

      const img = new Image()
      img.src = imageData
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }
        ctx.drawImage(img, 0, 0)

        const cv = window.cv
        const src = cv.imread(canvas)

        // Sort corners: top-left, top-right, bottom-right, bottom-left
        const sorted = [...corners].sort((a, b) => a.y - b.y)
        const topCorners = sorted.slice(0, 2).sort((a, b) => a.x - b.x)
        const bottomCorners = sorted.slice(2).sort((a, b) => a.x - b.x)

        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          topCorners[0].x, topCorners[0].y,
          topCorners[1].x, topCorners[1].y,
          bottomCorners[1].x, bottomCorners[1].y,
          bottomCorners[0].x, bottomCorners[0].y
        ])

        // Calculate output dimensions
        const widthTop = Math.sqrt(
          Math.pow(topCorners[1].x - topCorners[0].x, 2) +
          Math.pow(topCorners[1].y - topCorners[0].y, 2)
        )
        const widthBottom = Math.sqrt(
          Math.pow(bottomCorners[1].x - bottomCorners[0].x, 2) +
          Math.pow(bottomCorners[1].y - bottomCorners[0].y, 2)
        )
        const maxWidth = Math.max(widthTop, widthBottom)

        const heightLeft = Math.sqrt(
          Math.pow(topCorners[0].x - bottomCorners[0].x, 2) +
          Math.pow(topCorners[0].y - bottomCorners[0].y, 2)
        )
        const heightRight = Math.sqrt(
          Math.pow(topCorners[1].x - bottomCorners[1].x, 2) +
          Math.pow(topCorners[1].y - bottomCorners[1].y, 2)
        )
        const maxHeight = Math.max(heightLeft, heightRight)

        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          maxWidth - 1, 0,
          maxWidth - 1, maxHeight - 1,
          0, maxHeight - 1
        ])

        // Get perspective transform matrix
        const transform = cv.getPerspectiveTransform(srcPoints, dstPoints)

        // Apply perspective transform
        const dst = new cv.Mat()
        const dsize = new cv.Size(maxWidth, maxHeight)
        cv.warpPerspective(src, dst, transform, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())

        // Convert back to canvas
        const resultCanvas = document.createElement("canvas")
        resultCanvas.width = maxWidth
        resultCanvas.height = maxHeight
        cv.imshow(resultCanvas, dst)

        const result = resultCanvas.toDataURL("image/png")

        // Cleanup
        src.delete()
        srcPoints.delete()
        dstPoints.delete()
        transform.delete()
        dst.delete()

        resolve(result)
      }
    })
  }

  const enhanceImage = (imageData: string, level: "auto" | "low" | "medium" | "high"): Promise<{ processed: string; contrast: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = imageData
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve({ processed: imageData, contrast: 1.0 })
          return
        }
        ctx.drawImage(img, 0, 0)

        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageDataObj.data

        // Determine enhancement factor based on level
        let contrast = 1.0
        switch (level) {
          case "low": contrast = 1.1; break
          case "medium": contrast = 1.3; break
          case "high": contrast = 1.5; break
          case "auto":
          default:
            // Auto-detect based on image brightness
            let avgBrightness = 0
            for (let i = 0; i < data.length; i += 4) {
              avgBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3
            }
            avgBrightness /= (data.length / 4)
            contrast = avgBrightness < 128 ? 1.4 : 1.2
            break
        }

        // Apply contrast enhancement with white background optimization
        for (let i = 0; i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            // Convert to grayscale for text detection
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3

            // Apply contrast
            let enhanced = ((data[i + j] / 255 - 0.5) * contrast + 0.5) * 255
            enhanced = Math.max(0, Math.min(255, enhanced))

            // Make white backgrounds whiter
            if (gray > 200) {
              enhanced = Math.min(255, enhanced * 1.1)
            }

            data[i + j] = enhanced
          }
        }

        ctx.putImageData(imageDataObj, 0, 0)
        const processed = canvas.toDataURL("image/png")
        resolve({ processed, contrast })
      }
    })
  }

  const processImage = async (imageDataStr?: string) => {
    const imgData = imageDataStr || imageData
    if (!imgData) return

    setIsProcessing(true)

    try {
      if (opencvReady) {
        // Step 1: Edge detection
        setProcessingStatus("Detecting document edges...")
        const { edges, preview } = await detectEdges(imgData)
        setEdgePreview(preview)

        // Step 2: Perspective correction
        if (edges.length >= 4) {
          setProcessingStatus("Correcting perspective...")
          const corrected = await correctPerspective(imgData, edges)
          setImageData(corrected)
        }
      }

      // Step 3: Enhance image
      setProcessingStatus("Enhancing image quality...")
      const { processed, contrast } = await enhanceImage(opencvReady ? imageData || imgData : imgData, enhancementLevel)
      setProcessedImage(processed)

      // Step 4: OCR
      setProcessingStatus("Recognizing text...")
      const worker = await createWorker("ind+eng")
      const { data: { text, confidence: conf } } = await worker.recognize(processed)
      await worker.terminate()

      setOcrText(text)
      setConfidence(conf)
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
    setEdgePreview(null)
    setOcrText("")
    setConfidence(0)
  }

  const handleComplete = () => {
    onScanComplete({
      imageData: imageData!,
      processedImageData: processedImage || undefined,
      ocrText,
      confidence,
      metadata: {
        perspectiveCorrected: opencvReady,
        contrast: 1.0,
      }
    })
    reset()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-4">
        {!opencvReady && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading OpenCV.js...</span>
          </div>
        )}

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
                  Take a photo or upload an image. Auto-enhancement enabled.
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
                <h3 className="text-lg font-semibold">Processing Document</h3>
                <p className="text-sm text-muted-foreground">
                  {processingStatus}
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

              {!autoProcess && (
                <div className="flex gap-2">
                  <Button onClick={() => processImage()} disabled={isProcessing} className="flex-1 gap-2">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Auto Enhance
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={isProcessing} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                </div>
              )}
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
                  {opencvReady && (
                    <Badge variant="outline">
                      <Crop className="w-3 h-3 mr-1" />
                      Auto-Cropped
                    </Badge>
                  )}
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

              {edgePreview && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Edge Detection Preview</p>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={edgePreview}
                      alt="Edge detection"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

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
