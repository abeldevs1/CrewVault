"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Bookmark,
  BookOpen,
  GraduationCap,
  Trophy,
  ChevronRight,
  Eye,
  FileUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<"uploads" | "bookmarks" | "exams">("uploads");
  const [myUploads, setMyUploads] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [examSessions, setExamSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/materials?mine=true").then((r) => r.json()).catch(() => ({ materials: [] })),
      fetch("/api/bookmarks").then((r) => r.json()).catch(() => ({ library: [] })),
      fetch("/api/exams/history").then((r) => r.json()).catch(() => ({ sessions: [] })),
    ])
      .then(([uploadsData, bmData, examData]) => {
        if (uploadsData.materials) setMyUploads(uploadsData.materials);
        if (bmData.library) setBookmarks(bmData.library);
        if (examData.sessions) setExamSessions(examData.sessions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Personal Aviation Study Dashboard
          </div>
          <h1 className="text-2xl font-extrabold text-white">My Library & Learning Hub</h1>
          <p className="text-xs text-slate-400">Track your uploaded materials, saved items, and examination progress.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/materials/upload"
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <FileUp className="w-3.5 h-3.5" />
            Upload Material
          </Link>

          <Link
            href="/exams"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            Take Practice Exam
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">My Uploaded Materials</div>
          <div className="text-2xl font-extrabold text-sky-400">{myUploads.length}</div>
          <div className="text-[10px] text-slate-500">Persistent study documents</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">Saved Library Bookmarks</div>
          <div className="text-2xl font-extrabold text-indigo-400">{bookmarks.length}</div>
          <div className="text-[10px] text-slate-500">Materials, Exams & Posts</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">Exams Completed</div>
          <div className="text-2xl font-extrabold text-emerald-400">{examSessions.length}</div>
          <div className="text-[10px] text-slate-500">Recorded sessions & scores</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "uploads"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          My Uploads ({myUploads.length})
        </button>

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "bookmarks"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Bookmarks ({bookmarks.length})
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "exams"
              ? "border-sky-400 text-sky-400 bg-sky-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Exam Attempts ({examSessions.length})
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Loading your library data...
        </div>
      ) : activeTab === "uploads" ? (
        <div className="space-y-3">
          {myUploads.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Uploads Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven&apos;t uploaded any study materials yet. Upload your first PDF, image, or document to build your personal library.
              </p>
              <Link
                href="/materials/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold hover:bg-sky-500/20 transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload Study Material
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myUploads.map((mat) => (
                <div
                  key={mat.id}
                  className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase">
                        {mat.material_type}
                      </span>

                      {mat.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </div>

                    <Link href={`/materials/${mat.id}`}>
                      <h3 className="text-sm font-bold text-slate-100 hover:text-sky-300 transition-colors line-clamp-1">
                        {mat.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {mat.description || "Uploaded study material."}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-400">{mat.aircraft || "Q400"} • {mat.subject}</span>
                    <Link
                      href={`/materials/${mat.id}`}
                      className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      Open Detail
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "bookmarks" ? (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-2 border border-slate-800">
              <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Saved Bookmarks</h3>
              <p className="text-xs text-slate-400">Browse the material vault or exam center and save items to quickly find them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase mr-2">
                      {bm.item_type}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {bm.material_title || bm.exam_title || bm.post_title || "Saved Item"}
                    </span>
                  </div>
                  <Link
                    href={
                      bm.item_type === "material"
                        ? `/materials/${bm.item_id}`
                        : bm.item_type === "exam"
                        ? `/exams/${bm.item_id}`
                        : `/posts`
                    }
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 text-xs"
                  >
                    View
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {examSessions.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-slate-800">
              <Trophy className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Exam Attempts Yet</h3>
              <p className="text-xs text-slate-400">Take an adaptive practice exam or official mock exam to track your scores and weak areas.</p>
              <Link
                href="/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Browse Available Exams
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {examSessions.map((sess) => (
                <div key={sess.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{sess.exam_title || "Practice Exam Session"}</span>
                      {sess.passed ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">PASSED</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold">ATTEMPTED</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Score: <strong className="text-slate-200">{sess.score ?? 0} / {sess.total_score ?? 0}</strong> ({sess.percentage?.toFixed(0) ?? 0}%)
                    </div>
                  </div>

                  <Link
                    href={`/results/${sess.id}`}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 text-xs"
                  >
                    Review Mistake Breakdown
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
