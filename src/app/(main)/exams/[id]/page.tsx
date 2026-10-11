"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Clock, ShieldCheck, Play, ArrowRight, ChevronLeft } from "lucide-react";
import { Exam } from "@/types";

export default function ExamOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetch("/api/exams")
        .then((r) => r.json())
        .then((data) => {
          if (data.exams) {
            const found = data.exams.find((e: any) => e.id === id);
            if (found) setExam(found);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleStartExam = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch(`/api/exams/${id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start exam");

      router.push(`/exam-session/${data.session_id}`);
    } catch (err: any) {
      setError(err.message);
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading exam setup...</div>;
  }

  if (!exam) {
    return <div className="text-center py-20 text-xs text-slate-400">Exam not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/exams" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Exam Hub
      </Link>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            Immutable Exam Snapshot Session
          </div>
          <h1 className="text-2xl font-extrabold text-white">{exam.title}</h1>
          <p className="text-xs text-slate-400">{exam.description || "Official Cabin Crew Examination."}</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Questions</div>
            <div className="text-lg font-bold text-white mt-1">{exam.total_questions}</div>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Time Limit</div>
            <div className="text-lg font-bold text-sky-400 mt-1">{exam.time_limit_minutes} Mins</div>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Passing Score</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{exam.passing_percentage}%</div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Exam Resilience & Anti-Loss Feature
          </div>
          <p>
            Your examination questions are frozen into an immutable session snapshot. If your connection drops or you refresh the page, your progress and timer will safely resume.
          </p>
        </div>

        <button
          onClick={handleStartExam}
          disabled={starting}
          className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {starting ? "Initializing Immutable Session..." : "Begin Examination"}
          {!starting && <Play className="w-4 h-4 fill-white" />}
        </button>
      </div>
    </div>
  );
}
