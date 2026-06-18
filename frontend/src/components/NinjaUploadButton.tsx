"use client"

import React, { useState, useRef } from "react"
import { Camera, Zap, X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EnhancedDocumentScanner, type ScanResult } from "./EnhancedDocumentScanner"
import { api } from "@/lib/api/client"
import { motion, AnimatePresence } from "framer-motion"

interface NinjaUploadButtonProps {
  courseId?: number
  topicId?: number
  onUploadSuccess?: (result: any) => void
}

export function NinjaUploadButton({ courseId, topicId, onUploadSuccess }: NinjaUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [title, setTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result)
    // Auto-generate title from OCR text
    const firstLine = result.ocrText.split("\n")[0].trim()
    setTitle(firstLine || `Scan ${new Date().toLocaleString("id-ID")}`)
  }

  const handleQuickUpload = async () => {
    if (!scanResult?.processedImageData) return

    setIsUploading(true)

    try {
      const response = await api.post("/api/materials", {
        course_id: courseId,
        topic_id: topicId,
        title,
        type: "image",
        content: scanResult.processedImageData,
        ocr_text: scanResult.ocrText,
        metadata: {
          confidence: scanResult.confidence,
          scanned_at: new Date().toISOString(),
        }
      })

      if (response.status === 201) {
        onUploadSuccess?.(response.data)
        handleClose()
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setScanResult(null)
    setTitle("")
  }

  const handleDirectCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsOpen(true)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Quick upload"
      >
        <Zap className="w-6 h-6" />
      </motion.button>

      {/* Quick Capture Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDirectCapture}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-secondary/90 transition-colors"
        aria-label="Direct camera capture"
      >
        <Camera className="w-6 h-6" />
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              {!scanResult ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Ninja Upload</h2>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click()
                        }
                      }}
                      className="h-32 flex-col gap-2"
                    >
                      <Camera className="w-8 h-8" />
                      <span>Take Photo</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = "image/*"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setScanResult({
                                imageData: reader.result as string,
                                processedImageData: reader.result as string,
                                ocrText: "",
                                confidence: 0,
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        input.click()
                      }}
                      className="h-32 flex-col gap-2"
                    >
                      <Upload className="w-8 h-8" />
                      <span>Upload Image</span>
                    </Button>
                  </div>

                  <div className="mt-6">
                    <EnhancedDocumentScanner
                      onScanComplete={handleScanComplete}
                      onClose={handleClose}
                      autoProcess={true}
                    />
                  </div>
                </Card>
              ) : (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Review & Upload</h2>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Processed Image</p>
                      <img
                        src={scanResult.processedImageData}
                        alt="Processed"
                        className="w-full rounded-lg border"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Extracted Text</p>
                      <div className="w-full h-48 p-3 bg-muted rounded-lg overflow-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {scanResult.ocrText || "No text detected"}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      placeholder="Enter material title"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleQuickUpload}
                      disabled={isUploading || !title}
                      className="flex-1 gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Material
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setScanResult(null)}
                      disabled={isUploading}
                    >
                      Rescan
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
