"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Sparkles, BookOpen, GraduationCap, AlertTriangle, ArrowRight, ChevronRight, Eye } from "lucide-react";

export default function ForYouPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/for-you")
      .then((res) => res.json())
      .then((json) => {
        if (json.recommendations) {
          setData(json.recommendations);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        Generating personalized study recommendations...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Personalized For You
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Tailored Aircraft Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 max-w-lg">
            Recommended study guides and adaptive exams for your aircraft focus ({data?.user_aircraft?.join(", ") || "Q400"}).
          </p>
        </div>

        <Link
          href="/exams"
          className="px-5 py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all shrink-0 z-10"
        >
          <GraduationCap className="w-4 h-4" />
          Take Mock Exam
        </Link>
      </div>

      {/* Weak Area Recommendation Alert */}
      {data?.weak_topics && data.weak_topics.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">Weak Area Identified</div>
              <div className="text-xs text-slate-300">
                Recommended: <strong className="text-white">{data.recommended_exam}</strong>
              </div>
            </div>
          </div>

          <Link
            href="/exams"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl transition-all shrink-0"
          >
            Start Weak Area Practice
          </Link>
        </div>
      )}

      {/* Recently Uploaded Materials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            Recently Uploaded Study Materials
          </h2>
          <Link href="/materials" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
            Browse All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.recently_uploaded?.map((item: any) => (
            <div key={item.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:border-sky-500/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase">
                    {item.material_type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.aircraft || "Q400"}</span>
                </div>
                <Link href={`/materials/${item.id}`} className="block hover:text-sky-300 font-bold text-xs text-white line-clamp-2">
                  {item.title}
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>By {item.uploader_name}</span>
                <Link href={`/materials/${item.id}`} className="text-sky-400 font-semibold flex items-center gap-0.5">
                  Read <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Practice & Mock Exams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Available Online Examinations
          </h2>
          <Link href="/exams" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
            View All Exams
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.available_exams?.map((exam: any) => (
            <div key={exam.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {exam.is_official ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Official Exam
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                      Practice Mock
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">{exam.aircraft || "Q400"}</span>
                </div>
                <h3 className="text-xs font-bold text-white">{exam.title}</h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>{exam.total_questions} Questions</span>
                  <span>•</span>
                  <span>{exam.time_limit_minutes} Mins</span>
                  <span>•</span>
                  <span>Pass: {exam.passing_percentage}%</span>
                </div>
              </div>

              <Link
                href={`/exams/${exam.id}`}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow shrink-0"
              >
                Start
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
