"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Image as ImageIcon,
  Layers,
  Minimize2,
  Files,
  ChevronDown,
} from "lucide-react";

interface BundleFileMeta {
  name: string;
  mime: string;
  size: number;
  r2_key: string;
  index: number;
  extracted_markdown?: string;
  extracted_text?: string;
}

interface DocumentViewerProps {
  materialId: string;
  filename: string;
  mimeType: string;
  extractedMarkdown?: string;
  extractedText?: string;
  bundleFilesMeta?: BundleFileMeta[] | null;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewer({
  materialId,
  filename,
  mimeType,
  extractedMarkdown,
  extractedText,
  bundleFilesMeta,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Multi-file bundle state
  const hasBundle = bundleFilesMeta && bundleFilesMeta.length > 1;
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showFileMenu, setShowFileMenu] = useState(false);

  // Determine active file info
  const activeFile = hasBundle ? bundleFilesMeta[selectedFileIndex] : null;
  const activeName = activeFile ? activeFile.name : filename;
  const activeMime = activeFile ? activeFile.mime : mimeType;
  const activeMarkdown = activeFile?.extracted_markdown || extractedMarkdown;
  const activeText = activeFile?.extracted_text || extractedText;

  // Construct URLs for the active file
  const baseFileUrl = `/api/materials/${materialId}/file`;
  const fileUrl = hasBundle
    ? `${baseFileUrl}?bundle_index=${selectedFileIndex}`
    : baseFileUrl;
  const downloadUrl = hasBundle
    ? `${baseFileUrl}?bundle_index=${selectedFileIndex}&download=1`
    : `${baseFileUrl}?download=1`;

  const lowerName = (activeName || "").toLowerCase();
  const isPdf = activeMime.includes("pdf") || lowerName.endsWith(".pdf");
  const isImage =
    activeMime.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(lowerName);
  const isDocx =
    activeMime.includes("wordprocessingml") || lowerName.endsWith(".docx");
  const isPptx =
    activeMime.includes("presentationml") || lowerName.endsWith(".pptx");
  const isTextOrMd =
    activeMime.includes("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md");

  // Reset slide when switching files
  useEffect(() => {
    setCurrentSlide(0);
    setZoom(100);
  }, [selectedFileIndex]);

  // Parse slides from extracted markdown (for PPTX)
  const slides = useMemo(() => {
    if (!isPptx || !activeMarkdown) return [];
    const parts = activeMarkdown
      .split(/(?:\n|^)---\s*(?:\n|$)|(?=(?:\n|^)## Slide \d+)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("# Presentation:"));

    return parts.map((slideContent) => {
      const lines = slideContent.split("\n").filter((l) => l.trim());
      const titleMatch = lines[0]?.match(/^##\s*Slide\s*\d+:?\s*(.*)/i);
      const title =
        titleMatch
          ? titleMatch[1].trim()
          : lines[0]?.replace(/^#+\s*/, "") || "Untitled Slide";
      const bodyLines = titleMatch ? lines.slice(1) : lines.slice(1);
      const bullets = bodyLines
        .map((l) =>
          l
            .replace(/^[-*•]\s*/, "")
            .replace(/^#+\s*/, "")
            .trim()
        )
        .filter((l) => l.length > 0);
      return { title, bullets, raw: slideContent };
    });
  }, [isPptx, extractedMarkdown]);

  // Keyboard navigation for slides
  useEffect(() => {
    if (!isPptx || slides.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentSlide((s) => Math.max(s - 1, 0));
      } else if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPptx, slides.length, isFullScreen]);

  return (
    <div
      className={`space-y-4 ${isFullScreen ? "fixed inset-0 z-50 bg-[#050a12] p-4 md:p-6 overflow-y-auto" : ""}`}
    >
      {/* ── Multi-file Bundle Selector ── */}
      {hasBundle && (
        <div className="glass-card rounded-2xl border border-indigo-500/25 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/15">
            <div className="flex items-center gap-2">
              <Files className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">
                Bundle — {bundleFilesMeta.length} files
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Viewing {selectedFileIndex + 1} of {bundleFilesMeta.length}
            </span>
          </div>

          {/* File tab strip */}
          <div className="flex gap-1 p-2 overflow-x-auto flex-wrap">
            {bundleFilesMeta.map((f, idx) => {
              const fLower = f.name.toLowerCase();
              const fIsPdf = f.mime.includes("pdf") || fLower.endsWith(".pdf");
              const fIsImg = f.mime.startsWith("image/");
              const fIsPptx = f.mime.includes("presentationml") || fLower.endsWith(".pptx");
              const fIsDocx = f.mime.includes("wordprocessingml") || fLower.endsWith(".docx");

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                    idx === selectedFileIndex
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
                      : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                  }`}
                >
                  {fIsPdf && <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  {fIsImg && <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {fIsPptx && <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {fIsDocx && <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  {!fIsPdf && !fIsImg && !fIsPptx && !fIsDocx && (
                    <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{humanSize(f.size)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Viewer Toolbar ── */}
      <div className="glass-card p-2.5 md:p-3 rounded-2xl border border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
            {isPdf && <FileText className="w-4 h-4 text-rose-400 shrink-0" />}
            {isImage && <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
            {isDocx && <FileText className="w-4 h-4 text-blue-400 shrink-0" />}
            {isPptx && <Layers className="w-4 h-4 text-amber-400 shrink-0" />}
            {isTextOrMd && <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span className="truncate">{activeName}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(isImage || isPdf) && (
            <div className="flex items-center gap-0.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2 py-1">
              <button
                onClick={() => setZoom((z) => Math.max(z - 15, 50))}
                className="text-slate-400 hover:text-white p-1"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-300 w-8 text-center font-mono">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 15, 200))}
                className="text-slate-400 hover:text-white p-1"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFullScreen((f) => !f)}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={downloadUrl}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── 1. PDF Viewer ── */}
      {isPdf && (
        <div className="glass-card rounded-2xl border border-slate-800/60 overflow-hidden min-h-[500px] md:min-h-[650px] flex flex-col">
          <iframe
            key={fileUrl}
            src={`${fileUrl}#zoom=${zoom}`}
            title={activeName}
            className="w-full flex-1 min-h-[500px] md:min-h-[650px] border-0"
          />
        </div>
      )}

      {/* ── 2. Image Viewer ── */}
      {isImage && (
        <div className="glass-card p-4 md:p-6 rounded-2xl border border-slate-800/60 flex items-center justify-center min-h-[400px] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={fileUrl}
            src={fileUrl}
            alt={activeName}
            style={{ width: `${zoom}%`, maxWidth: zoom > 100 ? "none" : "100%" }}
            className="rounded-xl shadow-2xl transition-all duration-200 object-contain mx-auto"
          />
        </div>
      )}

      {/* ── 3. DOCX Preview ── */}
      {isDocx && (
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 text-xs text-slate-400">
            <span>Word Document Preview</span>
            <span className="text-blue-400 font-medium">Formatted Content</span>
          </div>
          <div className="prose prose-invert max-w-none text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {activeMarkdown || "Document text loading..."}
          </div>
        </div>
      )}

      {/* ── 4. ✈ PPTX Presentation Viewer ── */}
      {isPptx && (
        <div className="space-y-4 animate-fade-in">
          {/* Slide Controls Bar */}
          <div className="glass-card p-3 rounded-2xl border border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 rounded-lg">
                Slide {currentSlide + 1} / {Math.max(slides.length, 1)}
              </span>
              {slides.length > 1 && (
                <select
                  value={currentSlide}
                  onChange={(e) => setCurrentSlide(parseInt(e.target.value, 10))}
                  className="bg-slate-900/80 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {slides.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {idx + 1}. {s.title.substring(0, 40)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide((s) => Math.max(s - 1, 0))}
                className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-30 rounded-xl text-slate-200 flex items-center gap-1 font-medium transition-colors border border-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={currentSlide >= slides.length - 1}
                onClick={() => setCurrentSlide((s) => Math.min(s + 1, slides.length - 1))}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-xl text-white flex items-center gap-1 font-medium transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Slide Canvas */}
          {slides.length > 0 && (
            <div className="slide-canvas aspect-[16/9] max-w-4xl mx-auto p-6 md:p-10 lg:p-14 flex flex-col justify-between">
              <div
                className="flex-1 flex flex-col justify-center animate-fade-in"
                key={currentSlide}
              >
                <div className="mb-6 md:mb-8">
                  <h2 className="text-lg md:text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
                    {slides[currentSlide].title}
                  </h2>
                  <div className="mt-3 w-16 md:w-24 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full" />
                </div>

                {slides[currentSlide].bullets.length > 0 && (
                  <ul className="space-y-2.5 md:space-y-3.5">
                    {slides[currentSlide].bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 group">
                        <span className="mt-1.5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shrink-0 group-hover:scale-125 transition-transform" />
                        <span className="text-sm md:text-base lg:text-lg text-slate-200 leading-relaxed font-light">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {slides[currentSlide].bullets.length === 0 && (
                  <div className="flex items-center justify-center flex-1 text-slate-500 text-sm italic">
                    Visual diagram or schematic slide
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between text-[10px] md:text-[11px] text-slate-500 font-mono">
                <span className="truncate max-w-[50%]">{activeName}</span>
                <span>
                  {currentSlide + 1} / {slides.length}
                </span>
              </div>
            </div>
          )}

          {/* Slide Thumbnail Strip */}
          {slides.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`slide-thumbnail shrink-0 w-28 md:w-36 p-2.5 rounded-xl bg-slate-900/80 text-left transition-all ${
                    idx === currentSlide ? "active" : ""
                  }`}
                >
                  <div className="text-[9px] md:text-[10px] font-bold text-slate-300 truncate">
                    {idx + 1}. {slide.title}
                  </div>
                  {slide.bullets.length > 0 && (
                    <div className="text-[8px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                      {slide.bullets[0]}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. TXT / Markdown Reader ── */}
      {isTextOrMd && (
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-slate-800/60">
          <div className="prose prose-invert max-w-none text-xs md:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
            {activeMarkdown || activeText || "Text content loaded."}
          </div>
        </div>
      )}

      {/* ── 6. Binary / Other File Fallback ── */}
      {!isPdf && !isImage && !isDocx && !isPptx && !isTextOrMd && (
        <div className="glass-card p-10 rounded-2xl border border-slate-800/60 text-center space-y-4">
          <FileCode className="w-12 h-12 text-slate-500 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-white">{activeName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct in-browser viewer is not available for this file type ({activeMime}). You can download and open it locally.
            </p>
          </div>
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" /> Download {activeName}
          </a>
        </div>
      )}
    </div>
  );
}
