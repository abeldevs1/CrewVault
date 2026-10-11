"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Trophy,
  Award,
  Play,
  FileText,
  AlertCircle,
  ExternalLink,
  Trash2,
  Layers,
  ArrowRight,
  Compass,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";

export default function CurriculumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const curriculumId = params?.id as string;

  const [curriculum, setCurriculum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchCurriculum = async () => {
    try {
      const res = await fetch(`/api/curricula/${curriculumId}`);
      const data = await res.json();
      if (data.curriculum) {
        setCurriculum(data.curriculum);
      } else {
        setError(data.error || "Curriculum not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/curricula/${curriculumId}/enroll`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchCurriculum();
      } else {
        alert(data.error || "Failed to enroll");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleMaterialRead = async (materialId: string, currentCompleted: boolean) => {
    setActionLoading(`mat-${materialId}`);
    try {
      const res = await fetch(`/api/curricula/${curriculumId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_material",
          material_id: materialId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entire curriculum?")) return;
    try {
      const res = await fetch(`/api/curricula/${curriculumId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/curricula");
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <PlaneLoader text="Loading Training Curriculum Pathway..." />
      </div>
    );
  }

  if (error || !curriculum) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Curriculum Not Found</h2>
        <p className="text-xs text-slate-400">{error || "The requested curriculum track does not exist."}</p>
        <Link
          href="/curricula"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Curricula Catalog
        </Link>
      </div>
    );
  }

  const progress = curriculum.user_progress;
  const isEnrolled = !!progress;
  const isGraduated = progress?.status === "completed";
  const completedMats: string[] = progress?.completed_materials || [];
  const completedQuizzes: string[] = progress?.completed_quizzes || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link
          href="/curricula"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Curricula Catalog
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
            title="Delete Curriculum"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Graduation Banner if Completed */}
      {isGraduated && (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-400/25 shrink-0">
              <Trophy className="w-9 h-9" />
            </div>
            <div className="space-y-1 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Flight Academy Certified
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Official Curriculum Graduation Achieved!
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Congratulations! You have satisfied all ground school requirements, module quizzes, and graduation finals for the{" "}
                <span className="text-emerald-300 font-semibold">{curriculum.title}</span> track.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold text-center">
                100% COMPLETE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                {curriculum.category || "Initial Training"}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {curriculum.aircraft || "General Fleet"}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {curriculum.airline || "Global Aviation"}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {curriculum.estimated_duration || "4 Weeks"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {curriculum.title}
            </h1>

            {curriculum.description && (
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                {curriculum.description}
              </p>
            )}

            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Curated by: <strong className="text-slate-300">{curriculum.creator_name || "Academy Instructor"}</strong></span>
              <span>•</span>
              <span>Passing standard: <strong className="text-slate-300">{curriculum.passing_percentage || 80}%</strong></span>
            </div>
          </div>

          {/* Action / Enrollment Button */}
          <div className="shrink-0 flex flex-col items-center lg:items-end gap-3">
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
              >
                {enrolling ? "Enrolling Trainee..." : "Enroll in Curriculum Track"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full sm:w-64 glass-card p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Track Progress</span>
                  <span className="text-blue-400 font-mono font-bold">
                    {progress.progress_percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isGraduated ? "bg-emerald-400" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}
                    style={{ width: `${progress.progress_percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  {isGraduated ? "Course graduated successfully" : `${completedMats.length} materials studied`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Architecture & Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Nav Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Curriculum Modules ({curriculum.modules?.length || 0})
            </h3>
          </div>

          <div className="space-y-2">
            {(curriculum.modules || []).map((mod: any, idx: number) => {
              const isActive = activeModuleIndex === idx;
              const moduleMats = mod.materials || [];
              const allModMatsCompleted = moduleMats.length > 0 && moduleMats.every((m: any) => completedMats.includes(m.id));

              return (
                <button
                  key={idx}
                  onClick={() => setActiveModuleIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? "bg-blue-600/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5"
                      : "bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold line-clamp-1">{mod.title}</h4>
                    </div>
                    {mod.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 pl-7">
                        {mod.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {allModMatsCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isActive ? "rotate-90 text-blue-400" : ""}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          {curriculum.modules && curriculum.modules[activeModuleIndex] ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              {/* Module Header */}
              <div className="space-y-1 pb-4 border-b border-slate-800">
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                  Module {activeModuleIndex + 1} of {curriculum.modules.length}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {curriculum.modules[activeModuleIndex].title}
                </h3>
                {curriculum.modules[activeModuleIndex].description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {curriculum.modules[activeModuleIndex].description}
                  </p>
                )}
              </div>

              {/* Study Materials in this Module */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Required Study Materials & Manuals
                </h4>

                <div className="space-y-2">
                  {(curriculum.modules[activeModuleIndex].materials || []).map((mat: any) => {
                    const isDone = completedMats.includes(mat.id);
                    return (
                      <div
                        key={mat.id}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleMaterialRead(mat.id, isDone)}
                            disabled={actionLoading === `mat-${mat.id}`}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                              isDone
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                : "bg-slate-800 border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40"
                            }`}
                            title={isDone ? "Completed" : "Mark as completed"}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <div>
                            <Link
                              href={`/materials/${mat.id}`}
                              className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors flex items-center gap-1.5"
                            >
                              {mat.title}
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{mat.material_type || "Study Notes"}</span>
                              {mat.subject && (
                                <>
                                  <span>•</span>
                                  <span>{mat.subject}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/materials/${mat.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 transition-colors"
                        >
                          Read Material
                        </Link>
                      </div>
                    );
                  })}

                  {(!curriculum.modules[activeModuleIndex].materials || curriculum.modules[activeModuleIndex].materials.length === 0) && (
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No standalone study manuals attached to this module.
                    </div>
                  )}
                </div>
              </div>

              {/* Module Quiz */}
              {curriculum.modules[activeModuleIndex].quiz && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Module Knowledge Check
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {curriculum.modules[activeModuleIndex].quiz.title}
                      </h4>
                    </div>

                    {completedQuizzes.includes(curriculum.modules[activeModuleIndex].quiz.id) ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/exams/${curriculum.modules[activeModuleIndex].quiz.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    <Play className="w-3.5 h-3.5" /> Launch Module Quiz
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-xs text-slate-500">
              Select a module from the track list to view its contents.
            </div>
          )}
        </div>
      </div>

      {/* Graduation Finals Hub */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            Official Academy Final Examinations
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Curriculum Graduation Finals
          </h2>
          <p className="text-xs text-slate-400">
            Pass the designated final examination categories with {curriculum.passing_percentage || 80}% or higher to achieve certified graduation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Safety Final */}
          {curriculum.has_safety_final && (
            <div className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-900/60 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                    Safety Final
                  </span>
                  {progress?.safety_final_score !== null && progress?.safety_final_score !== undefined ? (
                    <span className="text-emerald-400 text-xs font-mono font-bold">
                      {progress.safety_final_score}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-mono">Not Taken</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">
                  {curriculum.safety_final?.title || "Safety & Emergency Procedures Final"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Covers emergency equipment, slide operations, ditching, and fire drills.
                </p>
              </div>

              <Link
                href={curriculum.safety_final ? `/exams/${curriculum.safety_final.id}` : "/exams"}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
              >
                <Play className="w-3.5 h-3.5" /> Start Safety Final
              </Link>
            </div>
          )}

          {/* Service Final */}
          {curriculum.has_service_final && (
            <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-slate-900/60 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                    Service Final
                  </span>
                  {progress?.service_final_score !== null && progress?.service_final_score !== undefined ? (
                    <span className="text-emerald-400 text-xs font-mono font-bold">
                      {progress.service_final_score}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-mono">Not Taken</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">
                  {curriculum.service_final?.title || "Cabin Service & Hospitality Final"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comprehensive test on bar services, passenger care, special meals, and service sequences.
                </p>
              </div>

              <Link
                href={curriculum.service_final ? `/exams/${curriculum.service_final.id}` : "/exams"}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                <Play className="w-3.5 h-3.5" /> Start Service Final
              </Link>
            </div>
          )}

          {/* Grand School Final */}
          {curriculum.has_school_final && (
            <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900/60 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                    Grand Final
                  </span>
                  {progress?.school_final_score !== null && progress?.school_final_score !== undefined ? (
                    <span className="text-emerald-400 text-xs font-mono font-bold">
                      {progress.school_final_score}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-mono">Not Taken</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">
                  {curriculum.school_final?.title || "Ground School Fleet Final Examination"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Final comprehensive evaluation testing all technical, safety, first aid, and customer care standards.
                </p>
              </div>

              <Link
                href={curriculum.school_final ? `/exams/${curriculum.school_final.id}` : "/exams"}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
              >
                <Play className="w-3.5 h-3.5" /> Start Grand Final
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
