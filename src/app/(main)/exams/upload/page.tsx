"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileQuestion,
  UploadCloud,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Edit3,
  Clock,
  Sparkles,
} from "lucide-react";
import DragDropUploader from "@/components/DragDropUploader";
import { getAircraftGrouped } from "@/lib/aircraft";
import { CABIN_CREW_SUBJECTS, autoDetectMaterialMetadata } from "@/lib/subjects";

export default function ExamUploadPage() {
  const router = useRouter();

  // Mode: File Upload vs Direct Text / Markdown
  const [mode, setMode] = useState<"file" | "text">("file");

  // Form Fields
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Inflight Service & Hospitality");
  const [aircraft, setAircraft] = useState("General / All Fleet (Non-Aircraft Specific)");
  const [airline, setAirline] = useState("Global Aviation");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [timeLimit, setTimeLimit] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(80);
  const [createInteractiveExam, setCreateInteractiveExam] = useState(true);

  // Dynamic feedback
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const aircraftGroups = getAircraftGrouped();

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setError("");

    if (newFiles.length > 0) {
      const firstFile = newFiles[0];
      const detected = autoDetectMaterialMetadata(firstFile.name, "");
      setSubject(detected.suggestedSubject);
      setAircraft(detected.suggestedAircraft);
      setAutoDetectedBadge(
        `Auto-detected: ${detected.suggestedSubject} • ${detected.suggestedAircraft} (${newFiles.length} file${newFiles.length > 1 ? "s" : ""} queued)`
      );

      if (!title) {
        setTitle(firstFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } else {
      setAutoDetectedBadge(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedText(val);

    if (val.length > 30) {
      const detected = autoDetectMaterialMetadata(title || "Exam Paper", val);
      setSubject(detected.suggestedSubject);
      setAircraft(detected.suggestedAircraft);
      setAutoDetectedBadge(`Auto-detected: ${detected.suggestedSubject} • ${detected.suggestedAircraft}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadFiles: File[] = [];

    if (mode === "text") {
      if (!pastedText.trim()) {
        setError("Please enter or paste your exam questions.");
        return;
      }
      if (!title.trim()) {
        setError("Please provide a title for the exam paper.");
        return;
      }

      const fileName = `${title.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}_exam.md`;
      const blob = new Blob([pastedText], { type: "text/markdown;charset=utf-8" });
      uploadFiles = [new File([blob], fileName, { type: "text/markdown" })];
    } else {
      if (files.length === 0) {
        setError("Please select or drop exam paper documents or images.");
        return;
      }
      if (!title.trim()) {
        setError("Please provide an exam title.");
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
      formData.append("description", description || `Previous exam paper covering ${subject} for ${aircraft}`);
      formData.append("material_type", "Previous Exam");
      formData.append("subject", subject);
      formData.append("aircraft", aircraft);
      formData.append("airline", airline);
      formData.append("course", `Recurrent Assessment ${year}`);
      formData.append("difficulty", "Intermediate");
      formData.append("year", year.toString());

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload exam paper");
      }

      // If interactive exam requested, create an exam definition in exams table linked directly to this uploaded paper
      if (createInteractiveExam) {
        try {
          const genRes = await fetch("/api/exams/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              material_id: data.material_id,
              title: `${title} (Practice Test)`,
              description: `Interactive practice test of uploaded past exam (${year}). Passing mark: ${passingPercentage}%.`,
              aircraft,
              subject,
              difficulty: "Medium",
              time_limit_minutes: timeLimit,
              passing_percentage: passingPercentage,
              is_ai: false,
            }),
          });
          const genData = await genRes.json();
          if (genData.session_id) {
            setSuccessMsg(`Exam paper uploaded! Extracted questions are ready. Launching practice test...`);
            setTimeout(() => {
              router.push(`/exam-session/${genData.session_id}`);
            }, 1000);
            return;
          }
        } catch (exErr) {
          console.warn("Interactive exam link generation skipped:", exErr);
        }
      }

      setSuccessMsg("Previous Exam uploaded successfully! Question extraction and paper view are ready.");
      setTimeout(() => {
        router.push(`/exams`);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <FileQuestion className="w-3.5 h-3.5" />
          Dedicated Previous Exam Paper Hub
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Upload Previous Exam Paper</h1>
        <p className="text-xs md:text-sm text-slate-400">
          Upload past exam sheets, recurrent tests, or question papers. CrewVault extracts the questions, preserves the original paper, and enables practice tests.
        </p>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === "file"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Exam Document (Drag & Drop)
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === "text"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Write or Paste Exam Questions
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
        {autoDetectedBadge && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{autoDetectedBadge}</span>
          </div>
        )}

        {/* Input Method */}
        {mode === "file" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select or Drop Exam Documents & Photos (Multi-Page Supported)
            </label>
            <DragDropUploader
              multiple={true}
              files={files}
              onFilesChange={handleFilesChange}
              onClearFile={() => {
                setFiles([]);
                setAutoDetectedBadge(null);
              }}
              label="Click to select or drag & drop exam papers or question images here"
              sublabel="Upload PDF papers, question sheets, photos of exams, or DOCX. Auto-sorts and lets you reorder pages."
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Write or Paste Exam Questions
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
              placeholder="Paste exam questions, e.g.:&#10;&#10;Question 1: What is the minimum duration of the passenger chemical oxygen generator?&#10;A. 5 minutes&#10;B. 15 minutes&#10;C. 30 minutes&#10;D. 1 hour&#10;Correct Answer: B"
              className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>
        )}

        {/* Exam Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Exam Paper Title</label>
          <input
            type="text"
            required
            placeholder="e.g. 2026 Recurrent Inflight Service & Cabin Safety Official Exam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Subject & Aircraft */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject Category
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
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
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
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

        {/* Time Limit, Passing %, Year */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Time Limit (Minutes)</label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={180}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Passing Score (%)</label>
            <input
              type="number"
              min={50}
              max={100}
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Exam Year</label>
            <input
              type="number"
              min={2010}
              max={2030}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Interactive practice exam checkbox */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-3">
          <input
            type="checkbox"
            id="interactive-check"
            checked={createInteractiveExam}
            onChange={(e) => setCreateInteractiveExam(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="interactive-check" className="text-xs text-slate-300 cursor-pointer">
            <span className="font-semibold text-white block">
              Auto-generate interactive practice exam session
            </span>
            Converts extracted exam questions into a timed, interactive mock test that trainees can launch directly from the Examination Hub.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || (mode === "file" && files.length === 0) || (mode === "text" && !pastedText.trim())}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? "Extracting Exam Questions & Generating Test..." : "Upload & Publish Exam Paper"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
