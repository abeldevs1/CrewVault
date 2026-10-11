import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plane, Shield, BookOpen, GraduationCap, Search, Sparkles, Layers, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/for-you");
  }

  return (
    <div className="space-y-16 py-8 px-2 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold glow-sky">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Production Cabin Crew Knowledge & Examination Platform
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Master Your Aircraft <br />
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Procedures & Examinations
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          CrewVault connects cabin crew, trainees, and instructors across airlines. Share study guides, generate grounded practice questions, and take adaptive mock exams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-panel hover:bg-slate-800/80 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center justify-center transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Core Loops Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative group">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">1. SHARE & EXTRACT</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Upload PDFs, DOCX, PPTX, TXT notes. Automatically convert documents into lightweight Markdown representations and auto-extract question banks.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative group">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">2. IMMUTABLE EXAMS</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Take timed practice & mock exams with frozen question snapshots. Session state persists across refreshes and tracks topic accuracy.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3. IMPROVE & STUDY PACKS</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Identify weak areas (e.g. Flight Deck Doors, Emergency Equipment) and receive AI-generated Study Packs and targeted practice tests.
          </p>
        </div>
      </section>
    </div>
  );
}
