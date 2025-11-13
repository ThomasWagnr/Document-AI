"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { uploadDocument, getDocuments, deleteDocument, type DocumentOut } from "@/lib/api"
import { toast } from "sonner"

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UploadedFile {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress?: number
  error?: string
}

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [existingDocuments, setExistingDocuments] = useState<DocumentOut[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch existing documents when dialog opens
  useEffect(() => {
    if (open) {
      loadDocuments()
    }
  }, [open])

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const docs = await getDocuments()
      setExistingDocuments(docs)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      status: "pending",
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleDeleteDocument = async (id: string) => {
    const documentId = parseInt(id, 10)
    if (isNaN(documentId)) {
      toast.error("Invalid document ID")
      return
    }

    try {
      await deleteDocument(documentId)
      toast.success("Document deleted successfully")
      // Reload documents list to reflect the deletion
      await loadDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document"
      toast.error(errorMessage)
    }
  }

  const uploadFiles = async () => {
    for (const file of files) {
      if (file.status !== "pending") continue

      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 50 } : f)))

      try {
        const response = await uploadDocument(file.file)
        
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "success", progress: 100 } : f)))
        toast.success(`Successfully uploaded ${file.file.name}`)
        
        // Reload documents list
        await loadDocuments()
      } catch (error) {
        console.error("Error uploading file:", error)
        const errorMessage = error instanceof Error ? error.message : "Upload failed"
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error", error: errorMessage } : f)))
        toast.error(`Failed to upload ${file.file.name}: ${errorMessage}`)
      }
    }
  }

  const handleClose = () => {
    setFiles([])
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    // For now, just return a placeholder since DocumentOut doesn't have a date field
    return "Recently uploaded"
  }

  const allUploaded = files.length > 0 && files.every((f) => f.status === "success")
  const hasFiles = files.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{"Upload Documents"}</DialogTitle>
          <DialogDescription>{"Upload documents to add them to your RAG knowledge base."}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-4 pr-4">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-accent"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">{"Drag and drop files here, or click to browse"}</p>
              <p className="text-xs text-muted-foreground">{"PDF, TXT, DOCX, MD files up to 10MB"}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.md"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* File list */}
            {hasFiles && (
              <div>
                <h3 className="text-sm font-medium mb-2">{"Files to Upload"}</h3>
                <div className="rounded-lg border">
                  <div className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
                    {files.map((uploadedFile) => (
                      <div key={uploadedFile.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border">
                        <div className="flex-shrink-0">
                          {uploadedFile.status === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : uploadedFile.status === "error" ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : uploadedFile.status === "uploading" ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : (
                            <File className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                            {uploadedFile.status === "uploading" && (
                              <p className="text-xs text-primary">{uploadedFile.progress}%</p>
                            )}
                            {uploadedFile.status === "error" && (
                              <p className="text-xs text-destructive">{uploadedFile.error || "Upload failed"}</p>
                            )}
                          </div>
                          {uploadedFile.status === "uploading" && (
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadedFile.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {uploadedFile.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => removeFile(uploadedFile.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isLoadingDocuments && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
              </div>
            )}
            
            {!isLoadingDocuments && existingDocuments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">{"Uploaded Documents"}</h3>
                <div className="rounded-lg border">
                  <div className="p-4 space-y-2 max-h-[250px] overflow-y-auto">
                    {existingDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                        <div className="flex-shrink-0">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{doc.source}</p>
                            <span className="text-xs text-muted-foreground">{"•"}</span>
                            <p className="text-xs text-muted-foreground">{formatDate("")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc.id.toString())}
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            {allUploaded ? "Done" : "Cancel"}
          </Button>
          {!allUploaded && (
            <Button onClick={uploadFiles} disabled={!hasFiles || files.some((f) => f.status === "uploading")}>
              {files.some((f) => f.status === "uploading") ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {"Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {`Upload ${files.length} ${files.length === 1 ? "file" : "files"}`}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
