"use client";

import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface FileUploadProps {
  onFileUploaded: (file: File, fileId: string) => void;
  onFileRemoved: () => void;
  uploadedFile: File | null;
}

export default function FileUpload({
  onFileUploaded,
  onFileRemoved,
  uploadedFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please upload a PDF file.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const uploadToast = toast.loading("Uploading PDF...", {
      description: file.name,
    });

    try {
      const response = await axios.post("/api/pdf-upload", formData);
      if (response.status === 200) {
        toast.success("PDF uploaded successfully!", {
          id: uploadToast,
          description: `Created ${response.data.chunks} chunks from your document.`,
        });
        onFileUploaded(file, response.data.fileId);
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error("Upload failed", {
          id: uploadToast,
          description: error.response.data.error,
        });
      } else {
        toast.error("Upload failed", {
          id: uploadToast,
          description: "Please check console for details.",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileRemoved();
    toast.info("File removed", {
      description: "You can upload a new document.",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            e.target.files && handleFileUpload(e.target.files[0])
          }
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-lg font-medium text-slate-900 dark:text-slate-50">
              Processing your PDF...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This may take a moment
            </p>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="relative z-10 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
              <Upload className="w-8 h-8 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-50">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                PDF files only, up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
