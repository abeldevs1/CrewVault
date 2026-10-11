"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  HelpCircle,
  UserX,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

export default function ModerationQueuePage() {
  const [data, setData] = useState<any>({
    pending_materials: [],
    pending_questions: [],
    reports: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/moderation");
      const json = await res.json();
      if (json.pending_materials) {
        setData(json);
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Single Action
  const handleAction = async (targetType: string, targetId: string, action: "approve" | "reject" | "dismiss") => {
    setActionLoading(targetId);
    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          target_type: targetType,
          target_id: targetId,
          notes: `Moderated via Manager Console`,
        }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle selection
  const toggleSelect = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Select all materials
  const handleSelectAllMaterials = () => {
    const matKeys = (data.pending_materials || []).map((m: any) => `material:${m.id}`);
    const allSelected = matKeys.every((k: string) => selectedIds.has(k));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      matKeys.forEach((k: string) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  // Select all questions
  const handleSelectAllQuestions = () => {
    const qKeys = (data.pending_questions || []).map((q: any) => `question:${q.id}`);
    const allSelected = qKeys.every((k: string) => selectedIds.has(k));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      qKeys.forEach((k: string) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  // Select all across queue
  const handleSelectAll = () => {
    const allKeys = [
      ...(data.pending_materials || []).map((m: any) => `material:${m.id}`),
      ...(data.pending_questions || []).map((q: any) => `question:${q.id}`),
    ];
    const isAll = allKeys.length > 0 && allKeys.every((k: string) => selectedIds.has(k));
    if (isAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allKeys));
    }
  };

  // Batch action for selected items
  const handleBatchAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} ${selectedIds.size} selected item(s)?`)) return;

    setActionLoading("batch");
    const items = Array.from(selectedIds).map((k) => {
      const [type, id] = k.split(":");
      return { target_type: type, target_id: id };
    });

    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, items }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Approve All or Reject All in queue
  const handleQuickApproveOrRejectAll = async (action: "approve" | "reject") => {
    const totalCount = (data.pending_materials?.length || 0) + (data.pending_questions?.length || 0);
    if (totalCount === 0) return;

    if (!confirm(`Are you sure you want to ${action.toUpperCase()} ALL ${totalCount} pending items in the queue with 1 click?`)) {
      return;
    }

    setActionLoading("all");
    const allItems = [
      ...(data.pending_materials || []).map((m: any) => ({ target_type: "material", target_id: m.id })),
      ...(data.pending_questions || []).map((q: any) => ({ target_type: "question", target_id: q.id })),
    ];

    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, items: allItems }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPendingCount = (data.pending_materials?.length || 0) + (data.pending_questions?.length || 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Manager & Administrator Quality Control
          </div>
          <h1 className="text-2xl font-extrabold text-white">Content Moderation Queue</h1>
          <p className="text-xs text-slate-400">
            Review submitted materials, approve AI-generated questions, and batch approve/reject in 1 click.
          </p>
        </div>

        {totalPendingCount > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => handleQuickApproveOrRejectAll("approve")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve All ({totalPendingCount})</span>
            </button>
            <button
              onClick={() => handleQuickApproveOrRejectAll("reject")}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject All</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating / Sticky Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-30 p-4 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>{selectedIds.size} item(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => handleBatchAction("approve")}
              disabled={actionLoading !== null}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => handleBatchAction("reject")}
              disabled={actionLoading !== null}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Loading moderation queue...
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Pending Materials Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Pending Material Uploads ({data.pending_materials.length})
              </h2>

              {data.pending_materials.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllMaterials}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select / Deselect All Materials</span>
                </button>
              )}
            </div>

            {data.pending_materials.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center text-xs text-slate-400">
                No pending study material uploads requiring review.
              </div>
            ) : (
              <div className="space-y-3">
                {data.pending_materials.map((m: any) => {
                  const key = `material:${m.id}`;
                  const isSelected = selectedIds.has(key);

                  return (
                    <div
                      key={m.id}
                      className={`glass-card p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected ? "border-indigo-500/60 bg-indigo-950/20" : "border-slate-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(key)}
                          className="mt-1 text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                              {m.material_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.aircraft || "Q400"}</span>
                          </div>
                          <h3 className="text-xs font-bold text-white">{m.title}</h3>
                          <p className="text-[11px] text-slate-400">
                            Uploaded by <span className="text-slate-200">{m.uploader_name}</span> ({m.uploader_email})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAction("material", m.id, "approve")}
                          disabled={actionLoading === m.id}
                          className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction("material", m.id, "reject")}
                          disabled={actionLoading === m.id}
                          className="px-3.5 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 2. Pending Questions Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                AI & Extracted Questions Awaiting Approval ({data.pending_questions.length})
              </h2>

              {data.pending_questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllQuestions}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select / Deselect All Questions</span>
                </button>
              )}
            </div>

            {data.pending_questions.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center text-xs text-slate-400">
                No questions pending moderation review.
              </div>
            ) : (
              <div className="space-y-3">
                {data.pending_questions.map((q: any) => {
                  const key = `question:${q.id}`;
                  const isSelected = selectedIds.has(key);

                  return (
                    <div
                      key={q.id}
                      className={`glass-card p-4 rounded-2xl border space-y-3 transition-all ${
                        isSelected ? "border-indigo-500/60 bg-indigo-950/20" : "border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleSelect(key)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <span className="font-semibold text-slate-100">{q.question_text}</span>
                        </div>

                        {q.ai_generated ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                            AI Generated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                            Extracted
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs ${
                              opt === q.correct_answer
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold"
                                : "bg-slate-900/50 text-slate-400"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => handleAction("question", q.id, "approve")}
                          disabled={actionLoading === q.id}
                          className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction("question", q.id, "reject")}
                          disabled={actionLoading === q.id}
                          className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
