"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  ArrowDown01,
  RefreshCw,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

interface DragDropUploaderProps {
  // Single-file legacy support
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  onClearFile?: () => void;

  // Multi-file support
  multiple?: boolean;
  files?: File[];
  onFilesChange?: (files: File[]) => void;

  acceptedFormats?: string;
  maxSizeMb?: number;
  label?: string;
  sublabel?: string;
}

export default function DragDropUploader({
  onFileSelect,
  selectedFile,
  onClearFile,
  multiple = false,
  files = [],
  onFilesChange,
  acceptedFormats = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp,.csv",
  maxSizeMb = 100,
  label = "Click to select or drag & drop files here",
  sublabel = "Supports PDF, DOCX, PPTX, Images, Markdown, and TXT up to 100 MB",
}: DragDropUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for natural sorting (e.g., Page 1, Page 2, Page 10)
  const naturalSort = (list: File[]) => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return [...list].sort((a, b) => collator.compare(a.name, b.name));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleIncomingFiles = (incoming: FileList | File[]) => {
    setError(null);
    const newFiles: File[] = [];

    for (let i = 0; i < incoming.length; i++) {
      const f = incoming[i];
      if (f.size > maxSizeMb * 1024 * 1024) {
        setError(`File "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds ${maxSizeMb} MB limit.`);
        continue;
      }
      newFiles.push(f);
    }

    if (newFiles.length === 0) return;

    if (multiple && onFilesChange) {
      // Append and automatically naturally sort incoming files
      const combined = [...files, ...newFiles];
      const sorted = naturalSort(combined);
      onFilesChange(sorted);
    } else {
      // Single file mode
      if (onFileSelect) onFileSelect(newFiles[0]);
      if (onFilesChange) onFilesChange([newFiles[0]]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reordering functions for multi-file mode
  const moveFile = (index: number, direction: "up" | "down") => {
    if (!onFilesChange) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const copy = [...files];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onFilesChange(copy);
  };

  const removeFile = (index: number) => {
    if (!onFilesChange) return;
    const copy = files.filter((_, i) => i !== index);
    onFilesChange(copy);
  };

  const sortNatural = () => {
    if (!onFilesChange) return;
    onFilesChange(naturalSort(files));
  };

  const sortAlphabetical = () => {
    if (!onFilesChange) return;
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    onFilesChange(sorted);
  };

  const reverseOrder = () => {
    if (!onFilesChange) return;
    onFilesChange([...files].reverse());
  };

  const clearAll = () => {
    if (onFilesChange) onFilesChange([]);
    if (onClearFile) onClearFile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Active files in multi vs single mode
  const activeFiles = multiple ? files : selectedFile ? [selectedFile] : [];
  const totalSizeBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFormats}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Target Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 md:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-400 bg-blue-500/15 scale-[1.01] shadow-xl shadow-blue-500/20"
            : activeFiles.length > 0
            ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
            : "border-slate-800 hover:border-blue-500/60 bg-slate-950/50 hover:bg-slate-900/40"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              isDragging
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40 animate-pulse"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-400"
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              {isDragging
                ? "Drop your documents or photos here"
                : multiple
                ? "Select or drop multiple documents and image pages"
                : label}
            </p>
            <p className="text-xs text-slate-400">
              {multiple
                ? "Auto-sorts by page/number order. You can reorder manually below."
                : sublabel}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF, DOCX, PPTX, Images (JPEG/PNG), Markdown, TXT</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-File Queue and Reorder Canvas */}
      {activeFiles.length > 0 && (
        <div className="glass-panel p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3">
          {/* Queue Header & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Queued Files ({activeFiles.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                • {(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB total
              </span>
            </div>

            {multiple && activeFiles.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={sortNatural}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Auto-sort natural numeric page order (1, 2, 10...)"
                >
                  <ArrowDown01 className="w-3.5 h-3.5" />
                  Auto-Sort (1-9)
                </button>

                <button
                  type="button"
                  onClick={sortAlphabetical}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Sort A to Z"
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  Sort A-Z
                </button>

                <button
                  type="button"
                  onClick={reverseOrder}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Reverse current sequence"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reverse
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add More
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                  title="Clear all queued files"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* List of Files with Order Controls */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {activeFiles.map((f, idx) => {
              const isImage = f.type.startsWith("image/");
              const isFirst = idx === 0;
              const isLast = idx === activeFiles.length - 1;

              return (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  {/* Left: Sequence index badge & File details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300 shrink-0">
                      {isImage ? (
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                        {f.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="truncate">{f.type || "document"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Manual Up/Down & Remove buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {multiple && activeFiles.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveFile(idx, "up")}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-all"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFile(idx, "down")}
                          disabled={isLast}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-all"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => (multiple ? removeFile(idx) : clearAll())}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
