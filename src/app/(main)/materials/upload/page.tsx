"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Edit3,
  FileText,
  Info,
} from "lucide-react";
import DragDropUploader from "@/components/DragDropUploader";
import { getAircraftGrouped } from "@/lib/aircraft";
import { CABIN_CREW_SUBJECTS, MATERIAL_TYPES, autoDetectMaterialMetadata, MaterialTypeOption } from "@/lib/subjects";

export default function MaterialUploadPage() {
  const router = useRouter();

  // Mode: File Upload vs Direct Text / Markdown
  const [mode, setMode] = useState<"file" | "text">("file");

  // Form Fields
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialTypeOption>("Study Notes");
  const [subject, setSubject] = useState("Inflight Service & Hospitality");
  const [aircraft, setAircraft] = useState("General / All Fleet (Non-Aircraft Specific)");
  const [airline, setAirline] = useState("Global Aviation");
  const [course, setCourse] = useState("");
  const [difficulty, setDifficulty] = useState("All Levels");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [schoolFinalCategory, setSchoolFinalCategory] = useState<string>("");

  // Dynamic Auto-detection feedback
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const aircraftGroups = getAircraftGrouped();

  // Trigger dynamic auto-detection when files are selected or reordered
  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setError("");

    if (newFiles.length > 0) {
      const firstFile = newFiles[0];
      const detected = autoDetectMaterialMetadata(firstFile.name, "");
      setMaterialType(detected.suggestedType);
      setSubject(detected.suggestedSubject);
      setAircraft(detected.suggestedAircraft);
      setAutoDetectedBadge(
        `Auto-detected: ${detected.suggestedType} • ${detected.suggestedSubject} (${newFiles.length} file${newFiles.length > 1 ? "s" : ""} queued)`
      );

      if (!title) {
        setTitle(firstFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } else {
      setAutoDetectedBadge(null);
    }
  };

  // Trigger auto-detection when text is typed or pasted
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedText(val);

    if (val.length > 30) {
      const detected = autoDetectMaterialMetadata(title || "Pasted Notes", val);
      setMaterialType(detected.suggestedType);
      setSubject(detected.suggestedSubject);
      setAircraft(detected.suggestedAircraft);
      setAutoDetectedBadge(`Auto-detected from text: ${detected.suggestedType} • ${detected.suggestedSubject}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadFiles: File[] = [];

    // Direct text / Markdown authoring mode
    if (mode === "text") {
      if (!pastedText.trim()) {
        setError("Please enter or paste your study text / Markdown.");
        return;
      }
      if (!title.trim()) {
        setError("Please provide a title for your document.");
        return;
      }

      const fileName = `${title.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
      const blob = new Blob([pastedText], { type: "text/markdown;charset=utf-8" });
      uploadFiles = [new File([blob], fileName, { type: "text/markdown" })];
    } else {
      if (files.length === 0) {
        setError("Please select or drop document or image files to upload.");
        return;
      }
      if (!title.trim()) {
        setError("Please provide a title for the material.");
        return;
      }
      uploadFiles = files;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append("files", f));
      formData.append("file", uploadFiles[0]);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("material_type", materialType);
      formData.append("subject", subject);
      formData.append("aircraft", aircraft);
      formData.append("airline", airline);
      formData.append("course", course);
      formData.append("difficulty", difficulty);
      formData.append("year", year.toString());
      if (schoolFinalCategory) {
        formData.append("school_final_category", schoolFinalCategory);
      }

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process upload");
      }

      setSuccessMsg(data.message || "Material uploaded successfully!");
      setTimeout(() => {
        router.push(`/materials/${data.material_id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          CrewVault Aviation Knowledge Pipeline
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Upload Cabin Crew Study Material</h1>
        <p className="text-xs md:text-sm text-slate-400">
          Upload manuals, slide presentations, checklists, or write directly. Supports complete Boeing, Airbus, and Cabin Service curricula.
        </p>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === "file"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload File (Drag & Drop)
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === "text"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Write or Paste Text / Markdown
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Auto Detection Badge */}
        {autoDetectedBadge && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-300 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{autoDetectedBadge}</span>
          </div>
        )}

        {/* Input Method */}
        {mode === "file" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Upload Document & Image Files</label>
            <DragDropUploader
              multiple={true}
              files={files}
              onFilesChange={handleFilesChange}
              onClearFile={() => {
                setFiles([]);
                setAutoDetectedBadge(null);
              }}
              label="Click to select or drag & drop files here"
              sublabel="Upload single or multiple files (PDF, Word, PPTX, Images, Markdown). You can reorder pages/files before saving."
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Write or Paste Aviation Text / Markdown
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {pastedText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={10}
              required
              value={pastedText}
              onChange={handleTextChange}
              placeholder="Paste your study notes, SOP checklist, cabin service procedures, medical drills, or Markdown content here..."
              className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              CrewVault will automatically format this into a clean Markdown document (.md), store it in R2 storage, and generate an AI study pack.
            </p>
          </div>
        )}

        {/* Title & Material Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Material Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Inflight Service Galley Setup & Bar Service Procedures"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Material Type</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as MaterialTypeOption)}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Category & Aircraft Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject Category
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {CABIN_CREW_SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Aircraft Fleet & Model
            </label>
            <select
              value={aircraft}
              onChange={(e) => setAircraft(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
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
        </div>

        {/* Airline / Academy, Course, Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Airline / Academy</label>
            <input
              type="text"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder="e.g. Global Aviation"
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Course / Training Module</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Initial Recurrent 2026"
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Training Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="All Levels">All Levels</option>
              <option value="Beginner / Cadet">Beginner / Cadet</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced / Purser">Advanced / Purser</option>
            </select>
          </div>
        </div>

        {/* School Final Category */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-300">✈ School Final Assignment</span>
            <span className="text-[10px] text-slate-500 font-medium">(Optional — links this material to the School Final Hub)</span>
          </div>
          <select
            value={schoolFinalCategory}
            onChange={(e) => setSchoolFinalCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/80 border border-amber-500/30 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          >
            <option value="">— Not linked to School Final —</option>
            <option value="Safety Final">Safety Final</option>
            <option value="Service Final">Service Final</option>
            <option value="Both">Both — Safety &amp; Service Finals</option>
          </select>
          {schoolFinalCategory && (
            <p className="text-[11px] text-amber-400/80">
              This material will appear in the <strong>School Final Hub</strong> under &quot;{schoolFinalCategory}&quot; for all crew members to study.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Key Topics</label>
          <textarea
            rows={3}
            placeholder="Key cabin safety regulations, service standards, or door procedures covered..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (mode === "file" && files.length === 0) || (mode === "text" && !pastedText.trim())}
          className="w-full py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? "Processing Document & Generating Study Pack..." : "Upload & Process Material"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
