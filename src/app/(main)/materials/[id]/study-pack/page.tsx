"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function StudyPackPage() {
  const params = useParams();
  const id = params.id as string;

  const [studyPack, setStudyPack] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/materials/${id}/study-pack`)
        .then((res) => res.json())
        .then((data) => {
          if (data.study_pack) {
            setStudyPack(data.study_pack);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin glow-sky" />
        <p className="font-semibold text-slate-200">Generating AI Study Pack & Grounded Questions...</p>
      </div>
    );
  }

  if (!studyPack) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs">
        Failed to load Study Pack for this material.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href={`/materials/${id}`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Material Details
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Generated Aviation Study Pack
        </div>
        <h1 className="text-2xl font-extrabold text-white">{studyPack.material.title}</h1>
        <p className="text-xs text-slate-400">
          Synthesized summary, key revision notes, document questions, and grounded practice questions.
        </p>
      </div>

      {/* Summary Box */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Executive Aviation Summary
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          {studyPack.summary}
        </p>
      </div>

      {/* Key Revision Notes */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Key Revision Notes & Bullet Points
        </h3>
        <ul className="space-y-2">
          {studyPack.revision_notes?.map((note: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Grounded AI Practice Questions (Pending Moderation Review) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            AI Practice Questions (Grounded & Pending Moderation)
          </h3>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            pending_review
          </span>
        </div>

        <div className="space-y-4">
          {studyPack.practice_questions?.map((q: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Practice Question {idx + 1}</span>
                <span className="text-[10px] text-slate-400 font-mono">Grounded Source: {q.source_section}</span>
              </div>
              <p className="text-xs font-semibold text-white">{q.question_text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options?.map((opt: string, optIdx: number) => (
                  <div
                    key={optIdx}
                    className={`p-2.5 rounded-xl border text-xs ${
                      opt === q.correct_answer
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                        : "bg-slate-950/50 border-slate-800 text-slate-400"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {studyPack.practice_questions?.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={async () => {
                const res = await fetch(`/api/materials/${id}/study-pack`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    questions: studyPack.practice_questions,
                    summary: studyPack.summary,
                    revision_notes: studyPack.revision_notes,
                  }),
                });
                if (res.ok) {
                  alert("✅ Candidate questions successfully persisted to Question Bank (Pending Review)!");
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Candidate Questions to Question Bank
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
