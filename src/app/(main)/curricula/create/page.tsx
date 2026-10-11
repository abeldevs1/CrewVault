"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Trash2,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getAircraftGrouped } from "@/lib/aircraft";
import PlaneLoader from "@/components/PlaneLoader";

interface DraftModule {
  id: string;
  title: string;
  description: string;
  material_ids: string[];
  quiz_exam_id: string;
}

export default function CreateCurriculumPage() {
  const router = useRouter();

  // Basic Curriculum Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aircraft, setAircraft] = useState("General / All Fleet (Non-Aircraft Specific)");
  const [airline, setAirline] = useState("Global Aviation");
  const [category, setCategory] = useState("Initial Training");
  const [duration, setDuration] = useState("4 Weeks");
  const [passingPercentage, setPassingPercentage] = useState(80);

  // Optional Finals Toggles
  const [hasSafetyFinal, setHasSafetyFinal] = useState(true);
  const [hasServiceFinal, setHasServiceFinal] = useState(true);
  const [hasSchoolFinal, setHasSchoolFinal] = useState(false);
  const [safetyFinalExamId, setSafetyFinalExamId] = useState("");
  const [serviceFinalExamId, setServiceFinalExamId] = useState("");
  const [schoolFinalExamId, setSchoolFinalExamId] = useState("");

  // Modules Builder
  const [modules, setModules] = useState<DraftModule[]>([
    {
      id: "mod_1",
      title: "Module 1: General Aviation & Safety Protocol",
      description: "Core emergency procedures, cabin door mechanics, and pre-flight checks.",
      material_ids: [],
      quiz_exam_id: "",
    },
  ]);

  // Available Materials & Exams from Database
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aircraftGroups = getAircraftGrouped();

  useEffect(() => {
    // Fetch available materials and exams
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data) => {
        if (data.materials) setAvailableMaterials(data.materials);
      })
      .catch(console.error);

    fetch("/api/exams")
      .then((r) => r.json())
      .then((data) => {
        if (data.exams) setAvailableExams(data.exams);
      })
      .catch(console.error);
  }, []);

  const addModule = () => {
    const nextNum = modules.length + 1;
    setModules([
      ...modules,
      {
        id: `mod_${Date.now()}`,
        title: `Module ${nextNum}: New Training Stage`,
        description: "",
        material_ids: [],
        quiz_exam_id: "",
      },
    ]);
  };

  const removeModule = (index: number) => {
    if (modules.length <= 1) return;
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof DraftModule, value: any) => {
    const copy = [...modules];
    copy[index] = { ...copy[index], [field]: value };
    setModules(copy);
  };

  const toggleMaterialInModule = (moduleIndex: number, materialId: string) => {
    const mod = modules[moduleIndex];
    const currentList = mod.material_ids || [];
    const nextList = currentList.includes(materialId)
      ? currentList.filter((id) => id !== materialId)
      : [...currentList, materialId];
    updateModule(moduleIndex, "material_ids", nextList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a curriculum title.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/curricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          aircraft,
          airline,
          category,
          estimated_duration: duration,
          modules: modules.map((m) => ({
            id: m.id,
            title: m.title.trim(),
            description: m.description.trim(),
            material_ids: m.material_ids,
            quiz_exam_id: m.quiz_exam_id || null,
          })),
          has_safety_final: hasSafetyFinal,
          safety_final_exam_id: safetyFinalExamId || null,
          has_service_final: hasServiceFinal,
          service_final_exam_id: serviceFinalExamId || null,
          has_school_final: hasSchoolFinal,
          school_final_exam_id: schoolFinalExamId || null,
          passing_percentage: passingPercentage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish curriculum");
      }

      router.push(`/curricula/${data.curriculum_id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Back Link */}
      <Link
        href="/curricula"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Curricula Catalog
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          Instructor & Admin Curriculum Studio
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Craft Training Curriculum
        </h1>
        <p className="text-xs md:text-sm text-slate-400">
          Design a structured learning syllabus. Assemble training modules with manuals, practice quizzes, and optional final examinations.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
            Curriculum Overview
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Curriculum Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Boeing 787-9 Initial Conversion Academy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Course Scope
              </label>
              <textarea
                rows={3}
                placeholder="Detailed objectives, prerequisites, and learning outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Aircraft
                </label>
                <select
                  value={aircraft}
                  onChange={(e) => setAircraft(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="General / All Fleet (Non-Aircraft Specific)">General / All Fleet</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Curriculum Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Initial Training">Initial Training</option>
                  <option value="Type Rating Conversion">Type Rating Conversion</option>
                  <option value="Recurrent Assessment">Recurrent Assessment</option>
                  <option value="Senior Cabin Crew / Purser">Senior Cabin Crew / Purser</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4 Weeks / 40 Hours"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Interactive Modules Builder */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              Training Modules ({modules.length})
            </h2>

            <button
              type="button"
              onClick={addModule}
              className="px-3.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Module
            </button>
          </div>

          <div className="space-y-6">
            {modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="p-5 md:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4 relative"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Stage {modIdx + 1}
                  </span>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(modIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove this module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Module Title
                    </label>
                    <input
                      type="text"
                      required
                      value={mod.title}
                      onChange={(e) => updateModule(modIdx, "title", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Attach Module Quiz (Optional)
                    </label>
                    <select
                      value={mod.quiz_exam_id}
                      onChange={(e) => updateModule(modIdx, "quiz_exam_id", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No Quiz for this Module</option>
                      {availableExams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title} ({ex.total_questions} Qs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Attached Materials Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Attach Study Manuals & Documents</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {mod.material_ids.length} Selected
                    </span>
                  </label>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    {availableMaterials.length === 0 ? (
                      <p className="text-[11px] text-slate-500 p-2">No uploaded materials found in vault.</p>
                    ) : (
                      availableMaterials.map((mat) => {
                        const isSelected = mod.material_ids.includes(mat.id);
                        return (
                          <div
                            key={mat.id}
                            onClick={() => toggleMaterialInModule(modIdx, mat.id)}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-500/15 border border-blue-500/40 text-blue-200"
                                : "hover:bg-slate-900 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">{mat.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({mat.material_type})</span>
                            </div>
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected}
                              className="rounded border-slate-700 text-blue-500"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Optional Finals Configuration */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
            Final Examinations (Optional)
          </h2>
          <p className="text-xs text-slate-400">
            Graduation finals test crew readiness before granting certification. You can configure which finals are required for this curriculum.
          </p>

          <div className="space-y-4 pt-2">
            {/* Safety Final */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSafetyFinal}
                    onChange={(e) => setHasSafetyFinal(e.target.checked)}
                    className="rounded border-slate-700 text-rose-500 w-4 h-4"
                  />
                  <span>🔴 Safety Final Examination</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {hasSafetyFinal ? "Enabled" : "Optional / Disabled"}
                </span>
              </div>
              {hasSafetyFinal && (
                <select
                  value={safetyFinalExamId}
                  onChange={(e) => setSafetyFinalExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Auto-Assign Fleet Safety Final Exam</option>
                  {availableExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.total_questions} Questions)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Service Final */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasServiceFinal}
                    onChange={(e) => setHasServiceFinal(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 w-4 h-4"
                  />
                  <span>🔵 Inflight Service & Hospitality Final</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {hasServiceFinal ? "Enabled" : "Optional / Disabled"}
                </span>
              </div>
              {hasServiceFinal && (
                <select
                  value={serviceFinalExamId}
                  onChange={(e) => setServiceFinalExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Auto-Assign Fleet Service Final Exam</option>
                  {availableExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.total_questions} Questions)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* School / Fleet Grand Final */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSchoolFinal}
                    onChange={(e) => setHasSchoolFinal(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 w-4 h-4"
                  />
                  <span>🎓 Aviation School / Fleet Grand Final</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {hasSchoolFinal ? "Enabled" : "Optional / Disabled"}
                </span>
              </div>
              {hasSchoolFinal && (
                <select
                  value={schoolFinalExamId}
                  onChange={(e) => setSchoolFinalExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Auto-Assign Fleet Comprehensive Final</option>
                  {availableExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.total_questions} Questions)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Passing mark slider */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-white">Graduation Passing Benchmark</label>
                <p className="text-[11px] text-slate-400">Score percentage required to pass finals and earn graduation status.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={60}
                  max={100}
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value, 10) || 80)}
                  className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white text-center"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/curricula"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
          >
            {loading ? (
              <PlaneLoader text="Publishing curriculum to academy..." size="sm" variant="fly" />
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                Publish Curriculum
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
