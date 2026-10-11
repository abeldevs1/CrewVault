"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Download,
  Eye,
  Sparkles,
  FileText,
  HelpCircle,
  History,
  Trash2,
  Bookmark,
  Share2,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  FileQuestion,
  X,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { Material } from "@/types";
import DocumentViewer from "@/components/materials/DocumentViewer";

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [material, setMaterial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"viewer" | "markdown" | "text" | "questions" | "versions">("viewer");
  const [bookmarked, setBookmarked] = useState(false);
  const [error, setError] = useState("");

  // Generate Questions from Material State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genDifficulty, setGenDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [selectedGenBundleIndex, setSelectedGenBundleIndex] = useState<number | "all">("all");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  const handleGenerateQuestions = async () => {
    setGenLoading(true);
    setGenError("");
    try {
      const res = await fetch(`/api/materials/${id}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: genCount,
          difficulty: genDifficulty,
          bundle_index: selectedGenBundleIndex === "all" ? undefined : selectedGenBundleIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");
      if (data.session_id) {
        router.push(`/exam-session/${data.session_id}`);
      } else {
        alert(`Successfully generated ${data.count} questions from this material!`);
        setShowGenModal(false);
      }
    } catch (e: any) {
      setGenError(e.message);
    } finally {
      setGenLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetch(`/api/materials/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load material");
          return res.json();
        })
        .then((data) => {
          if (data.material) {
            setMaterial(data.material);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this material and all its versions?")) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/materials");
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        Loading material details...
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
        <ShieldCheck className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Material Not Available</h3>
        <p className="text-xs text-slate-400">{error || "This material could not be loaded."}</p>
        <Link href="/materials" className="inline-block px-4 py-2 bg-slate-800 text-xs font-semibold text-sky-400 rounded-xl">
          Back to Materials
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link href="/materials" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Material Vault
      </Link>

      {/* Header Info Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                {material.material_type}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                {material.aircraft || "Q400"}
              </span>
              <span className="text-[11px] text-slate-400">{material.airline}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white">{material.title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span>Uploaded by <strong className="text-slate-200">{material.uploader_name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {material.views_count} views
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={`/api/materials/${id}/file?download=1`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-sky-400" />
              Download Original
            </a>

            {material.status === "pending" && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/moderation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "approve",
                        target_type: "material",
                        target_id: id,
                      }),
                    });
                    if (res.ok) {
                      setMaterial((prev: any) => ({ ...prev, status: "approved" }));
                      alert("✅ Material successfully approved and published!");
                    } else {
                      const d = await res.json();
                      alert(d.error || "Approval failed. Requires Manager or Admin role.");
                    }
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Approve Material
              </button>
            )}

            <Link
              href={`/materials/${id}/study-pack`}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              AI Study Pack
            </Link>

            <button
              onClick={() => setShowGenModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <FileQuestion className="w-4 h-4 text-slate-950" />
              Generate Practice Quiz
            </button>

            <button
              onClick={handleDelete}
              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 rounded-xl transition-colors"
              title="Delete Material"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {material.description && (
          <p className="text-xs text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
            {material.description}
          </p>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("viewer")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "viewer"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Original Document Viewer
        </button>

        <button
          onClick={() => setActiveTab("markdown")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "markdown"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Markdown Representation
        </button>

        <button
          onClick={() => setActiveTab("text")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "text"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Extracted Raw Text
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "questions"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Extracted Questions ({material.extracted_questions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("versions")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "versions"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          Version History ({material.versions?.length || 1})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "viewer" && (
        <DocumentViewer
          materialId={id}
          filename={material.filename || material.title}
          mimeType={material.mime_type || "application/octet-stream"}
          extractedMarkdown={material.extracted_markdown}
          extractedText={material.extracted_text}
          bundleFilesMeta={(() => {
            try {
              return material.bundle_files_meta_json
                ? JSON.parse(material.bundle_files_meta_json)
                : null;
            } catch {
              return null;
            }
          })()}
        />
      )}

      {activeTab === "markdown" && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 prose prose-invert max-w-none text-xs md:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
          {material.extracted_markdown || "# No Markdown Available\n\nOriginal file saved."}
        </div>
      )}

      {activeTab === "text" && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
          {material.extracted_text || "No raw text extracted."}
        </div>
      )}

      {activeTab === "questions" && (
        <div className="space-y-4">
          {material.extracted_questions && material.extracted_questions.length > 0 ? (
            material.extracted_questions.map((q: any, idx: number) => (
              <div key={q.id || idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                  <span>Question {idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{q.difficulty || "Medium"}</span>
                </div>
                <p className="text-xs font-semibold text-slate-100">{q.question_text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt: string, optIdx: number) => (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border text-xs ${
                        opt === q.correct_answer
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                          : "bg-slate-900/50 border-slate-800/80 text-slate-300"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-400">
              No embedded questions were automatically detected in this document.
            </div>
          )}
        </div>
      )}

      {activeTab === "versions" && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200">Material Version History</h3>
          <div className="space-y-2">
            {material.versions?.map((v: any) => (
              <div key={v.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-sky-400 mr-2">Version {v.version_number}</span>
                  <span className="text-slate-300 font-mono">{v.filename}</span>
                  <span className="text-[10px] text-slate-500 ml-2">({(v.size_bytes / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Questions Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 max-w-md w-full space-y-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Generate Practice Quiz</h3>
              </div>
              <button
                onClick={() => setShowGenModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              CrewVault will extract and synthesize targeted multiple-choice exam questions strictly based on this document ({material.title}).
            </p>

            {genError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {genError}
              </div>
            )}

            <div className="space-y-4">
              {(() => {
                try {
                  const bundle = material.bundle_files_meta_json ? JSON.parse(material.bundle_files_meta_json) : null;
                  if (bundle && bundle.length > 1) {
                    return (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Source Document in Bundle
                        </label>
                        <select
                          value={selectedGenBundleIndex}
                          onChange={(e) => setSelectedGenBundleIndex(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                        >
                          <option value="all">Entire Bundle ({bundle.length} files combined)</option>
                          {bundle.map((f: any, idx: number) => (
                            <option key={idx} value={f.index ?? idx}>
                              File {idx + 1}: {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Number of Questions
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[5, 10, 15, 20, 25, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGenCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        genCount === num
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setGenDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        genDifficulty === diff
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {genLoading ? (
              <div className="py-6 flex flex-col items-center justify-center">
                <PlaneLoader text={`Synthesizing ${genCount} questions from document...`} size="md" variant="fly" />
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  Start Practice Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
