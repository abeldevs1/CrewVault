"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Clock,
  Sparkles,
  Bot,
  Layers,
  FileQuestion,
  UploadCloud,
  FileText,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Download,
  ShieldAlert,
  Coffee,
  AlertTriangle,
  Shuffle,
  Play,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { Exam, Material } from "@/types";
import { getAircraftGrouped } from "@/lib/aircraft";
import { CABIN_CREW_SUBJECTS } from "@/lib/subjects";

export default function ExamsPage() {
  const router = useRouter();

  // Active Tab: "interactive" (Official & Practice tests) vs "past_papers" (Uploaded Previous Exams)
  const [activeTab, setActiveTab] = useState<"interactive" | "past_papers">("interactive");

  // State for interactive exams
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // State for past exam papers (materials with type 'Previous Exam')
  const [pastPapers, setPastPapers] = useState<Material[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  // User info for Admin/Manager actions
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Quick category generation state
  const [launchingCategory, setLaunchingCategory] = useState<string | null>(null);

  // Filters
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Modal State for Generating Exams
  const [showGenModal, setShowGenModal] = useState(false);
  const [genMode, setGenMode] = useState<"bank" | "ai">("bank");
  const [genAircraft, setGenAircraft] = useState("General / All Fleet (Non-Aircraft Specific)");
  const [genSubject, setGenSubject] = useState("Inflight Service & Hospitality");
  const [genCount, setGenCount] = useState(10);
  const [genTime, setGenTime] = useState(15);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(console.error);
  }, []);

  const isManagerOrAdmin = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Permanently delete exam "${title}" and all its questions and sessions from the database?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setExams((prev) => prev.filter((e) => e.id !== examId));
      } else {
        alert(data.error || "Failed to delete exam");
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete exam");
    }
  };

  const handleTogglePublish = async (examId: string, currentPublished: boolean | number) => {
    const nextVal = currentPublished ? 0 : 1;
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setExams((prev) =>
          prev.map((e) => (e.id === examId ? { ...e, is_published: nextVal } : e))
        );
      } else {
        alert(data.error || "Failed to update publish state");
      }
    } catch (e: any) {
      alert(e.message || "Failed to update publish state");
    }
  };

  const aircraftGroups = getAircraftGrouped();

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const params = new URLSearchParams();
      if (selectedAircraft) params.append("aircraft", selectedAircraft);
      if (selectedSubject) params.append("subject", selectedSubject);

      const res = await fetch(`/api/exams?${params.toString()}`);
      const data = await res.json();
      if (data.exams) setExams(data.exams);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchPastPapers = async () => {
    setLoadingPapers(true);
    try {
      const params = new URLSearchParams();
      params.append("material_type", "Previous Exam");
      if (selectedAircraft) params.append("aircraft", selectedAircraft);
      if (selectedSubject) params.append("subject", selectedSubject);

      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      if (data.materials) setPastPapers(data.materials);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPapers(false);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchPastPapers();
  }, [selectedAircraft, selectedSubject]);

  // Handle instant structured exam category launch
  const handleStartCategoryExam = async (categoryKey: string) => {
    setLaunchingCategory(categoryKey);
    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_category: categoryKey,
          mode: "bank",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start category exam");

      router.push(`/exam-session/${data.session_id}`);
    } catch (err: any) {
      alert(err.message || "Failed to start exam");
      setLaunchingCategory(null);
    }
  };

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError("");

    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: genMode,
          aircraft: genAircraft,
          subject: genSubject,
          question_count: genCount,
          time_limit_minutes: genTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate exam");

      router.push(`/exam-session/${data.session_id}`);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            Aviation Examination & Assessment Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Online Examination Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
            Simulate real airline assessments, practice safety emergencies, or test dangerous goods knowledge with automated grading and review.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/exams/upload"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Exam Paper
          </Link>

          <button
            onClick={() => setShowGenModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            Generate Custom Exam
          </button>
        </div>
      </div>

      {/* Structured Exam Categories Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Standardized Examination Categories
            </h2>
            <p className="text-xs text-slate-400">
              One-click assessment tracks configured strictly according to airline conversion and recurrent checklists.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Safety Final */}
          <div className="glass-card exam-cat-safety p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all glow-rose/5 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                  15 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                Safety Final
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3">
                Emergency Procedures, Cabin Doors, Fire Fighting, Survival, and Flight Deck Lockdown drills.
              </p>
            </div>

            <button
              onClick={() => handleStartCategoryExam("safety_final")}
              disabled={launchingCategory === "safety_final"}
              className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {launchingCategory === "safety_final" ? "Preparing..." : "Start Safety Exam"}
            </button>
          </div>

          {/* Card 2: Service Final */}
          <div className="glass-card exam-cat-service p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all glow-blue/5 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Coffee className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                  15 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Service Final
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3">
                Inflight Service & Hospitality, Standard Operating Procedures (SOPs), and Crew Resource Management.
              </p>
            </div>

            <button
              onClick={() => handleStartCategoryExam("service_final")}
              disabled={launchingCategory === "service_final"}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {launchingCategory === "service_final" ? "Preparing..." : "Start Service Exam"}
            </button>
          </div>

          {/* Card 3: DGR Assessment */}
          <div className="glass-card exam-cat-dgr p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all glow-amber/5 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                  10 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                DGR Assessment
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3">
                IATA Dangerous Goods Regulations, hazard labels, lithium battery rules, and spillage kits.
              </p>
            </div>

            <button
              onClick={() => handleStartCategoryExam("dgr_assessment")}
              disabled={launchingCategory === "dgr_assessment"}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {launchingCategory === "dgr_assessment" ? "Preparing..." : "Start DGR Exam"}
            </button>
          </div>

          {/* Card 4: Mixed Mock */}
          <div className="glass-card exam-cat-mixed p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all glow-emerald/5 group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Shuffle className="w-4 h-4" />
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  20 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Mixed Mock
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3">
                Randomized comprehensive simulation pulling questions across all aviation subjects and aircraft.
              </p>
            </div>

            <button
              onClick={() => handleStartCategoryExam("mixed_mock")}
              disabled={launchingCategory === "mixed_mock"}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {launchingCategory === "mixed_mock" ? "Preparing..." : "Start Mixed Exam"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("interactive")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "interactive"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Interactive Mock Exams ({exams.length})
        </button>

        <button
          onClick={() => setActiveTab("past_papers")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "past_papers"
              ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Previous Exam Papers & Uploads ({pastPapers.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <select
          value={selectedAircraft}
          onChange={(e) => setSelectedAircraft(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Aircraft Types</option>
          {Object.entries(aircraftGroups).map(([groupName, items]) => (
            <optgroup key={groupName} label={groupName}>
              {items.map((ac) => (
                <option key={ac.id} value={ac.model}>
                  {ac.model}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Subjects</option>
          {CABIN_CREW_SUBJECTS.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* TAB 1: Interactive Exams */}
      {activeTab === "interactive" && (
        <>
          {loadingExams ? (
            <div className="min-h-[30vh] flex flex-col items-center justify-center">
              <PlaneLoader text="Loading interactive mock exams..." size="md" variant="bounce" />
            </div>
          ) : exams.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center text-xs text-slate-400 space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Interactive Exams Found</h3>
              <p>Choose one of the standardized exam categories above or generate a custom exam!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {exam.is_official ? (
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Official Exam
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                            Practice Mock
                          </span>
                        )}

                        {isManagerOrAdmin && (
                          <button
                            onClick={() => handleTogglePublish(exam.id, (exam as any).is_published ?? 1)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                              (exam as any).is_published ?? 1
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                            }`}
                            title="Click to toggle publishing to students"
                          >
                            {(exam as any).is_published ?? 1 ? (
                              <>
                                <Eye className="w-2.5 h-2.5" /> Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-2.5 h-2.5" /> Hidden (Draft)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {exam.aircraft || "All Aircraft"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{exam.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {exam.description || "Comprehensive cabin crew examination."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>{exam.total_questions} Questions</span>
                      <span>•</span>
                      <span>{exam.time_limit_minutes} Mins</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Delete Exam from Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Link
                        href={`/exams/${exam.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                      >
                        Start Exam <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Uploaded Previous Exam Papers */}
      {activeTab === "past_papers" && (
        <>
          {loadingPapers ? (
            <div className="min-h-[30vh] flex flex-col items-center justify-center">
              <PlaneLoader text="Loading previous exam papers..." size="md" variant="bounce" />
            </div>
          ) : pastPapers.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center text-xs text-slate-400 space-y-4">
              <FileQuestion className="w-10 h-10 text-amber-500/70 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Previous Exam Papers Uploaded</h3>
              <p>Be the first to upload a recurrent check paper, past exam paper, or assessment questions!</p>
              <Link
                href="/exams/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                <UploadCloud className="w-4 h-4" /> Upload Exam Paper
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pastPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                        <FileQuestion className="w-3 h-3" /> Past Exam Paper
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {paper.aircraft || "General Fleet"} • {paper.year || 2026}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{paper.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {paper.description || `Official past paper covering ${paper.subject}.`}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                        {paper.subject}
                      </span>
                      {paper.airline && (
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                          {paper.airline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <a
                      href={`/api/materials/${paper.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Paper File
                    </a>

                    <Link
                      href={`/materials/${paper.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      View & Study Paper <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Generate Exam Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 max-w-lg w-full space-y-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Generate Custom Practice Exam</h2>
              </div>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800/60 rounded-lg"
              >
                ✕
              </button>
            </div>

            {genError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {genError}
              </div>
            )}

            <form onSubmit={handleGenerateExam} className="space-y-4">
              {/* Generation Mode: With or Without AI */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Generation Engine</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGenMode("bank")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      genMode === "bank"
                        ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                    Question Bank (Validated)
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenMode("ai")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      genMode === "ai"
                        ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Bot className="w-4 h-4 text-amber-400" />
                    AI Engine (Fresh Generator)
                  </button>
                </div>
              </div>

              {/* Aircraft & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Aircraft</label>
                  <select
                    value={genAircraft}
                    onChange={(e) => setGenAircraft(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100"
                  >
                    {Object.entries(aircraftGroups).map(([groupName, items]) => (
                      <optgroup key={groupName} label={groupName}>
                        {items.map((ac) => (
                          <option key={ac.id} value={ac.model}>
                            {ac.model}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100"
                  >
                    {CABIN_CREW_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Count & Time Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Questions</label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time Limit</label>
                  <select
                    value={genTime}
                    onChange={(e) => setGenTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100"
                  >
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={genLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
              >
                {genLoading ? "Generating Exam Session..." : `Generate & Start Exam (${genMode === "ai" ? "With AI" : "Without AI"})`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
