"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Download } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  title?: string;
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function goToPrevPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen);
  }

  function handleDownload() {
    window.open(url, "_blank");
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white overflow-auto"
    : "relative";

  return (
    <Card className={containerClass}>
      {isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10"
        >
          Exit Fullscreen
        </Button>
      )}

      <div className="flex items-center justify-between p-4 border-b">
        {title && <h3 className="font-semibold">{title}</h3>}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center p-4 overflow-auto" style={{ maxHeight: isFullscreen ? "calc(100vh - 120px)" : "600px" }}>
        <Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading={<div>Loading PDF...</div>}>
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>

      <div className="flex items-center justify-center gap-4 p-4 border-t">
        <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {pageNumber} of {numPages}
        </span>
        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
