"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  BookOpen,
  GraduationCap,
  Layers,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  X,
  Lock,
  Megaphone,
  Check,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";

export default function AdminConsolePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings & Feature Flags State
  const [hideBoilerplate, setHideBoilerplate] = useState(false);
  const [featureDiscussions, setFeatureDiscussions] = useState(true);
  const [featureSchoolFinal, setFeatureSchoolFinal] = useState(true);
  const [featureRecall, setFeatureRecall] = useState(true);
  const [featureAiGen, setFeatureAiGen] = useState(true);
  const [featureUploads, setFeatureUploads] = useState(true);
  const [announcementBanner, setAnnouncementBanner] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState("");

  // Exam Action State
  const [examActionLoading, setExamActionLoading] = useState<string | null>(null);

  // System Wipe Danger Zone State
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [confirmCodeInput, setConfirmCodeInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState("");
  const [wipeSuccess, setWipeSuccess] = useState("");

  const REQUIRED_WIPE_CODE = "WIPE-ALL-CREWVAULT-DATA";

  const fetchAdminData = () => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((json) => {
        if (json.stats) setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.settings) {
          setHideBoilerplate(json.settings.hide_boilerplate === "true");
          setFeatureDiscussions(json.settings.feature_peer_discussions !== "false");
          setFeatureSchoolFinal(json.settings.feature_school_final !== "false");
          setFeatureRecall(json.settings.feature_recall_studio !== "false");
          setFeatureAiGen(json.settings.feature_ai_generation !== "false");
          setFeatureUploads(json.settings.feature_student_uploads !== "false");
          setAnnouncementBanner(json.settings.site_announcement_banner || "");
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveSetting = async (key: string, value: string) => {
    setSavingSettings(true);
    setSettingsSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSettingsSuccessMsg("Setting saved successfully.");
        setTimeout(() => setSettingsSuccessMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleBoilerplate = async () => {
    const newValue = !hideBoilerplate;
    setHideBoilerplate(newValue);
    await handleSaveSetting("hide_boilerplate", String(newValue));
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete exam "${examTitle}"?\n\nThis will remove it from the database for all users, including all questions and active student exam sessions.`)) {
      return;
    }

    setExamActionLoading(examId);
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      const resData = await res.json();
      if (res.ok) {
        fetchAdminData();
      } else {
        alert(resData.error || "Failed to delete exam.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting exam.");
    } finally {
      setExamActionLoading(null);
    }
  };

  const handleTogglePublishExam = async (examId: string, currentStatus: boolean) => {
    setExamActionLoading(examId);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentStatus }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExamActionLoading(null);
    }
  };

  const handleExecuteWipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setWipeLoading(true);
    setWipeError("");
    setWipeSuccess("");

    try {
      const res = await fetch("/api/admin/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation_code: confirmCodeInput.trim(),
          password: adminPasswordInput,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to wipe database");
      }

      setWipeSuccess(resData.message || "Database wiped successfully.");
      setTimeout(() => {
        setShowWipeModal(false);
        fetchAdminData();
      }, 2000);
    } catch (err: any) {
      setWipeError(err.message);
    } finally {
      setWipeLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading admin console stats...</div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-xs text-slate-400">Admin access restricted.</div>;
  }

  const { stats, users, audit_logs, exams = [] } = data;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Platform Control & Audit Logging Console
          </div>
          <h1 className="text-2xl font-extrabold text-white">Administrator Dashboard</h1>
          <p className="text-xs text-slate-400">
            System overview, exam management, feature flags, storage governance, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/curricula/create"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/20"
          >
            <GraduationCap className="w-4 h-4" />
            Craft Curriculum
          </Link>

          <Link
            href="/admin/storage"
            className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4" />
            Storage Governance
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Users</div>
          <div className="text-2xl font-extrabold text-sky-400 mt-1">{stats.total_users}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Materials</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">{stats.total_materials}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Exams</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{stats.total_exams}</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Pending Review</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {stats.pending_moderation + stats.pending_questions}
          </div>
        </div>
      </div>

      {/* ── 1. EXAM MANAGEMENT SECTION (WITH PERMANENT DELETE) ── */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              Examination Management ({exams.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Delete exams permanently from the database for all users, or toggle publication visibility for students.
            </p>
          </div>
          <Link
            href="/exams"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            Launch Exam Hub
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
            No exams found in database. Create an exam from the Exam Hub or past paper upload.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Exam Title</th>
                  <th className="py-2.5 px-3">Subject / Aircraft</th>
                  <th className="py-2.5 px-3">Questions</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created By</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {exams.map((ex: any) => {
                  const isPublished = ex.is_published !== 0;
                  const isLoading = examActionLoading === ex.id;

                  return (
                    <tr key={ex.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{ex.title}</div>
                        {ex.school_final_track && (
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">
                            {ex.school_final_track}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-300 font-medium">{ex.subject || "General"}</div>
                        <div className="text-slate-500 text-[10px]">{ex.aircraft || "All Fleet"}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {ex.question_count || ex.total_questions} Qs
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isPublished ? "Published to Trainees" : "Draft / Hidden"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{ex.creator_name || "Admin"}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleTogglePublishExam(ex.id, isPublished)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                              isPublished
                                ? "border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                                : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                            }`}
                            title={isPublished ? "Hide from regular students" : "Share/Publish to regular students"}
                          >
                            {isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isPublished ? "Hide" : "Publish"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDeleteExam(ex.id, ex.title)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-rose-500/40 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex items-center gap-1 shadow-sm"
                            title="Delete exam permanently from DB"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. SITE FEATURE CONTROLS & PLATFORM GOVERNANCE ── */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            Platform Layout & Feature Controls
          </h2>
          {settingsSuccessMsg && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
              <Check className="w-3.5 h-3.5" /> {settingsSuccessMsg}
            </span>
          )}
        </div>

        {/* Announcement Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            Global Site Announcement Banner
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Recurrent School Finals scheduled for next Monday. Review Safety & Service modules!"
              value={announcementBanner}
              onChange={(e) => setAnnouncementBanner(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSaveSetting("site_announcement_banner", announcementBanner)}
              disabled={savingSettings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Save Banner
            </button>
          </div>
        </div>

        {/* Feature Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Peer Discussions */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Study Groups & Peer-to-Peer Chat</p>
              <p className="text-[11px] text-slate-400">Allow trainees to create groups and direct message</p>
            </div>
            <button
              onClick={() => {
                const nextVal = !featureDiscussions;
                setFeatureDiscussions(nextVal);
                handleSaveSetting("feature_peer_discussions", String(nextVal));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                featureDiscussions
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {featureDiscussions ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* School Final Hub */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">School Final Hub</p>
              <p className="text-[11px] text-slate-400">Safety & Service Final preparation track</p>
            </div>
            <button
              onClick={() => {
                const nextVal = !featureSchoolFinal;
                setFeatureSchoolFinal(nextVal);
                handleSaveSetting("feature_school_final", String(nextVal));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                featureSchoolFinal
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {featureSchoolFinal ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* Recall Studio */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Recall Studio (TypeToMemorize)</p>
              <p className="text-[11px] text-slate-400">Cabin crew active recall procedures studio</p>
            </div>
            <button
              onClick={() => {
                const nextVal = !featureRecall;
                setFeatureRecall(nextVal);
                handleSaveSetting("feature_recall_studio", String(nextVal));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                featureRecall
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {featureRecall ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* AI Question Generation */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">AI Practice Quiz Generator</p>
              <p className="text-[11px] text-slate-400">Allow on-demand AI quiz synthesis from documents</p>
            </div>
            <button
              onClick={() => {
                const nextVal = !featureAiGen;
                setFeatureAiGen(nextVal);
                handleSaveSetting("feature_ai_generation", String(nextVal));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                featureAiGen
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {featureAiGen ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>

        {/* Boilerplate Materials Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                Boilerplate & Seed Demo Materials Visibility
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hideBoilerplate
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {hideBoilerplate ? "Hidden from Members" : "Visible to All"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When hidden, initial sample training guides and boilerplate materials disappear from regular members&apos; views.
            </p>
          </div>

          <button
            type="button"
            disabled={savingSettings}
            onClick={handleToggleBoilerplate}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              hideBoilerplate
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {hideBoilerplate ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                Make Visible to All
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Hide from Members
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 3. PRIVILEGED AUDIT LOGS TABLE ── */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Privileged Audit Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {audit_logs?.map((log: any) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{log.actor_name || "System"}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-400">{log.action}</td>
                  <td className="py-2.5 px-3">
                    {log.target_type}: {log.target_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. DANGER ZONE: SYSTEM WIPE ── */}
      <div className="glass-card p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Danger Zone: Database Reset</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Clean all uploaded materials, question bank entries, examination sessions, results, curricula, and posts.
          This action preserves your Primary Administrator account while wiping all user data clean. Requires confirmation code and password.
        </p>

        <button
          type="button"
          onClick={() => setShowWipeModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Execute System Wipe & Clean Slate
        </button>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-rose-500/40 max-w-lg w-full space-y-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">Execute Nuclear System Wipe</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold">⚠️ Irreversible Deletion Precaution:</p>
              <p>
                This will immediately purge all materials, exam sessions, questions, curricula, posts, and notifications from Cloudflare D1. Your Administrator login will remain active.
              </p>
            </div>

            {wipeError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {wipeError}
              </div>
            )}

            {wipeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{wipeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteWipe} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Step 1: Enter Confirmation Code
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Type <span className="font-mono font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{REQUIRED_WIPE_CODE}</span> to confirm:
                </p>
                <input
                  type="text"
                  required
                  placeholder={REQUIRED_WIPE_CODE}
                  value={confirmCodeInput}
                  onChange={(e) => setConfirmCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Step 2: Enter Administrator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your current admin password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {wipeLoading ? (
                <div className="py-4 flex flex-col items-center justify-center">
                  <PlaneLoader text="Wiping and rebuilding clean database..." size="md" variant="fly" />
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowWipeModal(false)}
                    className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Cancel & Keep Safe
                  </button>
                  <button
                    type="submit"
                    disabled={confirmCodeInput.trim() !== REQUIRED_WIPE_CODE || !adminPasswordInput}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Confirm & Wipe All Data
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
