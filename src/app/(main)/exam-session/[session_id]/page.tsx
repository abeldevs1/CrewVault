"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Compass,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { FrozenQuestionSnapshot } from "@/types";

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session_id as string;

  const [session, setSession] = useState<any | null>(null);
  const [questions, setQuestions] = useState<FrozenQuestionSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(1200); // Default 20 mins in seconds
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Stale closure safeguard refs
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  const handleSubmitExam = useCallback(async () => {
    if (submittingRef.current) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answersRef.current).map(([qId, opt]) => ({
        question_id: qId,
        selected_option: opt,
        time_spent_seconds: 30,
      }));

      const res = await fetch(`/api/exams/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (res.ok) {
        localStorage.removeItem(`exam_sess_${sessionId}`);
        localStorage.removeItem(`exam_flags_${sessionId}`);
        router.push(`/results/${sessionId}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit exam");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }, [sessionId, router]);

  // Keep a stable ref to handleSubmitExam so timer never suffers from stale closure
  const handleSubmitExamRef = useRef(handleSubmitExam);
  handleSubmitExamRef.current = handleSubmitExam;

  // 1. Fetch Session & Restore Saved State
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/exams/session/${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.session) {
            setSession(data.session);
            const snaps = (data.session.question_snapshots || []).map((q: any) => ({
              ...q,
              question_id: q.question_id || q.id,
            }));
            setQuestions(snaps);

            // Restore previously saved answers
            if (data.session.saved_answers && data.session.saved_answers.length > 0) {
              const restored: Record<string, string> = {};
              data.session.saved_answers.forEach((ans: any) => {
                restored[ans.question_id] = ans.selected_option;
              });
              setAnswers(restored);
            } else {
              // LocalStorage fallback
              try {
                const cachedAnswers = localStorage.getItem(`exam_sess_${sessionId}`);
                if (cachedAnswers) setAnswers(JSON.parse(cachedAnswers));
                const cachedFlags = localStorage.getItem(`exam_flags_${sessionId}`);
                if (cachedFlags) setFlagged(JSON.parse(cachedFlags));
              } catch (e) {}
            }

            // Calculate remaining time with safe UTC ISO normalization
            let startTimeMs = Date.now();
            if (data.session.start_time) {
              const rawTime = String(data.session.start_time).trim();
              const isoString = rawTime.includes("T")
                ? (rawTime.endsWith("Z") ? rawTime : `${rawTime}Z`)
                : `${rawTime.replace(" ", "T")}Z`;
              const parsed = new Date(isoString).getTime();
              if (!isNaN(parsed)) {
                startTimeMs = parsed;
              }
            }

            const timeLimitMinutes = data.session.time_limit_minutes || 20;
            const timeLimitMs = timeLimitMinutes * 60 * 1000;
            let endMs = startTimeMs + timeLimitMs;

            // Safeguard: if elapsed time exceeded before opening or invalid clock, grant full or local stored remaining
            if (endMs <= Date.now() + 5000) {
              const cachedEnd = localStorage.getItem(`exam_end_${sessionId}`);
              if (cachedEnd && parseInt(cachedEnd, 10) > Date.now()) {
                endMs = parseInt(cachedEnd, 10);
              } else {
                endMs = Date.now() + timeLimitMs;
                try { localStorage.setItem(`exam_end_${sessionId}`, String(endMs)); } catch (e) {}
              }
            } else {
              try { localStorage.setItem(`exam_end_${sessionId}`, String(endMs)); } catch (e) {}
            }

            targetEndTimeRef.current = endMs;
            const initialRemaining = Math.max(0, Math.round((endMs - Date.now()) / 1000));
            setTimeLeft(initialRemaining);

            // If session already completed, redirect to results
            if (data.session.status === "completed") {
              router.push(`/results/${sessionId}`);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [sessionId, router]);

  // Target end time ref for monotonic continuous countdown
  const targetEndTimeRef = useRef<number>(Date.now() + 1200 * 1000);

  // 2. Continuous Monotonic Timer Countdown Effect
  useEffect(() => {
    if (loading || submitting || !session) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmitExamRef.current(); // Auto-submit when time expires
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, submitting, session]);

  const handleSelectOption = (qId: string, option: string) => {
    const updated = { ...answers, [qId]: option };
    setAnswers(updated);
    try {
      localStorage.setItem(`exam_sess_${sessionId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleToggleFlag = (qId: string) => {
    const updated = { ...flagged, [qId]: !flagged[qId] };
    setFlagged(updated);
    try {
      localStorage.setItem(`exam_flags_${sessionId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <PlaneLoader text="Loading secure examination session..." size="lg" variant="bounce" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-card max-w-lg mx-auto p-8 rounded-3xl text-center space-y-3 mt-12">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">No Questions in Session</h3>
        <p className="text-xs text-slate-400">
          This examination session does not contain any questions.
        </p>
        <button
          onClick={() => router.push("/exams")}
          className="btn-primary inline-flex items-center gap-2 mt-2"
        >
          Return to Exam Hub
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentQId = currentQ.question_id || (currentQ as any).id;
  const isCurrentFlagged = !!flagged[currentQId];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  const answeredCount = Object.keys(answers).filter((k) =>
    questions.some((q) => (q.question_id || (q as any).id) === k && answers[k])
  ).length;
  const flaggedCount = Object.keys(flagged).filter((k) => flagged[k]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Sticky Top Header Bar */}
      <div className="glass-panel sticky top-16 z-30 p-4 px-5 md:px-7 rounded-2xl border border-slate-800/80 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-blue-400" />
          </div>
          <div className="truncate">
            <h1 className="text-xs md:text-sm font-bold text-white truncate">
              {session?.exam_title || "Examination Session"}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">{answeredCount} answered</span>
              {flaggedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">{flaggedCount} flagged</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Sticky Timer & Submit Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-mono font-bold transition-all ${
              timeLeft < 180
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 glow-rose animate-pulse"
                : timeLeft < 360
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 glow-amber"
                : "bg-blue-500/10 text-blue-300 border-blue-500/30"
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish & Submit</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/60">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Grid: Question Content & Navigator Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Current Question Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
            {/* Question Header & Flags */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-300">
                    {currentQ.topic || "General Aviation"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-[10px] font-mono text-slate-400">
                    Difficulty: {currentQ.difficulty || "Medium"}
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-white leading-relaxed pt-1">
                  <span className="text-blue-400 font-mono mr-2">{currentIndex + 1}.</span>
                  {currentQ.question_text}
                </h2>
              </div>

              {/* Flag for Review Button */}
              <button
                type="button"
                onClick={() => handleToggleFlag(currentQId)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isCurrentFlagged
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 glow-amber"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
                title={isCurrentFlagged ? "Flagged for review" : "Flag question for review"}
              >
                <Flag className={`w-4 h-4 ${isCurrentFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
                <span className="hidden sm:inline">{isCurrentFlagged ? "Flagged" : "Flag"}</span>
              </button>
            </div>

            {/* Answer Choices */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQId] === option;
                const optionLabel = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(currentQId, option)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all group ${
                      isSelected
                        ? "bg-blue-500/15 border-blue-500 text-white font-semibold glow-blue"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all ${
                        isSelected
                          ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                          : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                      }`}
                    >
                      {optionLabel}
                    </span>
                    <span className="text-xs md:text-sm pt-1 leading-normal">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="text-xs text-slate-400 font-mono">
                {currentIndex + 1} / {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigator Grid Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 md:p-6 rounded-3xl border border-slate-800 space-y-4 sticky top-36">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400" />
                Question Navigator
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {answeredCount}/{questions.length} Done
              </span>
            </div>

            {/* Navigator Dots Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-2">
              {questions.map((q, idx) => {
                const qId = q.question_id || (q as any).id;
                const isAnswered = !!answers[qId];
                const isFlag = !!flagged[qId];
                const isCurrent = idx === currentIndex;

                // Color-coded statuses: answered (green), unanswered (gray), flagged (amber), current (blue outline)
                let statusClass = "q-nav-dot.unanswered unanswered";
                if (isFlag) {
                  statusClass = "flagged";
                } else if (isAnswered) {
                  statusClass = "answered";
                }

                return (
                  <button
                    key={qId || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`q-nav-dot ${statusClass} ${isCurrent ? "current ring-2 ring-blue-500" : ""}`}
                    title={`Question ${idx + 1} (${isFlag ? "Flagged" : isAnswered ? "Answered" : "Unanswered"})`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <span>Flagged ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-700/40 border border-slate-700" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded-full border-2 border-blue-500" />
                <span>Current Q</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Exam Session
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 max-w-md w-full space-y-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Confirm Exam Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to end your examination and grade your answers? Once submitted, your scores and feedback will be finalized.
            </p>

            {/* Breakdown stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <div className="text-lg font-extrabold text-emerald-400">{answeredCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Answered</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <div className="text-lg font-extrabold text-amber-400">{flaggedCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Flagged</div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                <div className="text-lg font-extrabold text-rose-400">{unansweredCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Unanswered</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>You have {unansweredCount} unanswered questions remaining.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Continue Exam
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitExam();
                }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? "Grading..." : "Yes, Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
