"use client";
import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  previewImport,
  importCourses,
  type ImportPreviewData,
} from "@/lib/api/excel";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImported,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setLoading(true);
      setError(null);
      setPreview(null);

      try {
        const data = await previewImport(selectedFile);
        setPreview(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to preview file"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile &&
        (droppedFile.name.endsWith(".xlsx") ||
          droppedFile.name.endsWith(".xls"))
      ) {
        handleFileSelect(droppedFile);
      } else {
        setError("Please upload an Excel file (.xlsx or .xls)");
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      await importCourses(file);
      onImported();
      onOpenChange(false);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Courses from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import courses, sessions, and materials
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors"
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop your Excel file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    disabled={loading || importing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground">
                    Analyzing file...
                  </p>
                </CardContent>
              </Card>
            )}

            {preview && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Import Preview</h3>
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Courses</p>
                        <p className="text-2xl font-bold">
                          {preview.courses.length}
                        </p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary">
                            {preview.courses.filter((c) => c.exists).length}{" "}
                            existing
                          </Badge>
                          <Badge>
                            {preview.courses.filter((c) => !c.exists).length}{" "}
                            new
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sessions</p>
                        <p className="text-2xl font-bold">
                          {preview.sessions.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Materials</p>
                        <p className="text-2xl font-bold">
                          {preview.materials.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {preview.courses.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Courses to Import</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {preview.courses.map((course, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{course.code}</span>
                              {" - "}
                              {course.name}
                              <span className="text-muted-foreground ml-2">
                                ({course.sks} SKS)
                              </span>
                            </div>
                            {course.exists ? (
                              <Badge variant="secondary">Update</Badge>
                            ) : (
                              <Badge>Create</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || importing || !!error}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
