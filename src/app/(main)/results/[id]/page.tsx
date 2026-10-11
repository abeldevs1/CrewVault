"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  BarChart3,
  ListChecks,
  Check,
  X,
  Clock,
  Layers,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { FrozenQuestionSnapshot } from "@/types";

interface SavedAnswer {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  time_spent_seconds?: number;
}

export default function ExamResultsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/exams/session/${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.session) setSession(data.session);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <PlaneLoader text="Grading and generating performance analytics..." size="lg" variant="fly" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass-card max-w-lg mx-auto p-8 rounded-3xl text-center space-y-3 mt-12">
        <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Result Record Not Found</h3>
        <p className="text-xs text-slate-400">The requested examination result could not be located.</p>
        <Link href="/exams" className="btn-primary inline-flex items-center gap-2 mt-2">
          Back to Exam Hub
        </Link>
      </div>
    );
  }

  const passed = session.passed;
  const analysis = session.performance_analysis;
  const questions: FrozenQuestionSnapshot[] = session.question_snapshots || [];
  const savedAnswers: SavedAnswer[] = session.saved_answers || [];

  // Build answer lookup map
  const answerMap: Record<string, SavedAnswer> = {};
  savedAnswers.forEach((ans) => {
    answerMap[ans.question_id] = ans;
  });

  // Calculate stats & topic breakdown
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const topicBreakdown: Record<string, { total: number; correct: number; wrong: number; unanswered: number }> = {};

  questions.forEach((q) => {
    const qId = q.question_id || (q as any).id;
    const userAns = answerMap[qId];
    const topic = q.topic || "General Aviation";

    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { total: 0, correct: 0, wrong: 0, unanswered: 0 };
    }
    topicBreakdown[topic].total += 1;

    if (!userAns || !userAns.selected_option) {
      unansweredCount += 1;
      topicBreakdown[topic].unanswered += 1;
    } else if (userAns.is_correct) {
      correctCount += 1;
      topicBreakdown[topic].correct += 1;
    } else {
      wrongCount += 1;
      topicBreakdown[topic].wrong += 1;
    }
  });

  // Filter questions for detailed review
  const filteredQuestions = questions.filter((q) => {
    const qId = q.question_id || (q as any).id;
    const userAns = answerMap[qId];
    if (filterMode === "correct") return userAns && userAns.is_correct;
    if (filterMode === "incorrect") return userAns && userAns.selected_option && !userAns.is_correct;
    if (filterMode === "unanswered") return !userAns || !userAns.selected_option;
    return true;
  });

  const percentage = session.percentage ?? (questions.length > 0 ? (correctCount / questions.length) * 100 : 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Examination Hub
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          Session ID: {sessionId.substring(0, 12)}...
        </span>
      </div>

      {/* Main Result Summary Banner */}
      <div
        className={`glass-panel p-8 md:p-10 rounded-3xl border text-center space-y-5 relative overflow-hidden shadow-2xl ${
          passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"
        }`}
      >
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border shadow-xl ${
            passed
              ? "bg-emerald-500/10 border-emerald-500/30 glow-emerald"
              : "bg-rose-500/10 border-rose-500/30 glow-rose"
          }`}
        >
          {passed ? (
            <Trophy className="w-10 h-10 text-emerald-400" />
          ) : (
            <XCircle className="w-10 h-10 text-rose-400" />
          )}
        </div>

        <div className="space-y-1.5">
          <div
            className={`text-xs font-black tracking-widest uppercase ${
              passed ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {passed ? "Examination Passed — Qualified" : "Examination Incomplete — Needs Review"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {session.score ?? correctCount} / {session.total_score ?? questions.length}{" "}
            <span className="text-xl md:text-3xl font-bold text-slate-400 font-mono">
              ({percentage.toFixed(0)}%)
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Passing threshold: <span className="text-white font-semibold">{session.passing_percentage}%</span> • Total Exam Time:{" "}
            <span className="text-white font-semibold">{session.time_limit_minutes} minutes</span>
          </p>
        </div>

        {/* Quick stat cards */}
        <div className="grid grid-cols-3 max-w-md mx-auto gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-lg font-black text-emerald-400">{correctCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Correct</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-lg font-black text-rose-400">{wrongCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Incorrect</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
            <div className="text-lg font-black text-slate-300">{unansweredCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Unanswered</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/exams"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Practice Exam
          </Link>
        </div>
      </div>

      {/* Topic Breakdown Stats */}
      {Object.keys(topicBreakdown).length > 0 && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Syllabus & Topic Breakdown
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              {Object.keys(topicBreakdown).length} Subjects Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Topic / Subject</th>
                  <th className="py-2.5 px-3 text-center">Questions</th>
                  <th className="py-2.5 px-3 text-center">Correct</th>
                  <th className="py-2.5 px-3 text-center">Wrong</th>
                  <th className="py-2.5 px-3 text-center">Accuracy</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(topicBreakdown).map(([tName, stat]) => {
                  const acc = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
                  const isMastered = acc >= 75;
                  return (
                    <tr key={tName} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{tName}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">{stat.total}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">{stat.correct}</td>
                      <td className="py-3 px-3 text-center font-mono text-rose-400">{stat.wrong}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isMastered ? "bg-emerald-500" : "bg-amber-500"}`}
                              style={{ width: `${acc}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">{acc.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isMastered ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            Proficient
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                            Review Required
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Performance Feedback */}
      {analysis && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Examiner Insights & Analysis
          </h2>

          <p className="text-xs text-slate-200 bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
            {analysis.overall_feedback}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> High Mastery Topics
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {analysis.strong_areas?.map((sa: string, idx: number) => (
                  <li key={idx}>✓ {sa}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Recommended Areas for Review
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {analysis.weak_areas?.map((wa: string, idx: number) => (
                  <li key={idx}>⚠️ {wa}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Full Question-by-Question Review Section */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-blue-400" />
              Full Question-by-Question Review
            </h2>
            <p className="text-xs text-slate-400">
              Compare your selected answers with official answers and view examiner explanations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "all" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode("correct")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "correct" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilterMode("incorrect")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "incorrect" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Wrong ({wrongCount})
            </button>
            <button
              onClick={() => setFilterMode("unanswered")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterMode === "unanswered" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Unanswered ({unansweredCount})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No questions matching this filter.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const qId = q.question_id || (q as any).id;
              const userAns = answerMap[qId];
              const isUnanswered = !userAns || !userAns.selected_option;
              const isCorrect = !isUnanswered && userAns.is_correct;

              // Border and banner color based on correctness
              const cardBorder = isUnanswered
                ? "border-slate-800 bg-slate-900/30"
                : isCorrect
                ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                : "border-rose-500/30 bg-rose-500/[0.02]";

              const badgeColor = isUnanswered
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : isCorrect
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30";

              return (
                <div
                  key={qId || idx}
                  className={`p-5 md:p-6 rounded-2xl border transition-all space-y-4 ${cardBorder}`}
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${badgeColor}`}>
                          {isUnanswered ? (
                            <>
                              <HelpCircle className="w-3 h-3" /> Unanswered
                            </>
                          ) : isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Incorrect
                            </>
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-semibold text-slate-300">
                          {q.topic || "General"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Difficulty: {q.difficulty || "Medium"}
                        </span>
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-white pt-1">
                        <span className="text-blue-400 font-mono mr-1.5">Q{idx + 1}.</span>
                        {q.question_text}
                      </h3>
                    </div>
                  </div>

                  {/* Options review with side-by-side indicator */}
                  <div className="space-y-2.5">
                    {q.options.map((option, optIdx) => {
                      const isUserChoice = userAns && userAns.selected_option === option;
                      const isCorrectChoice = q.correct_answer === option;

                      let optStyle = "bg-slate-900/50 border-slate-800/80 text-slate-400";
                      if (isCorrectChoice) {
                        optStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold";
                      } else if (isUserChoice && !isCorrect) {
                        optStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 font-semibold";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${optStyle}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                                isCorrectChoice
                                  ? "bg-emerald-500 text-white"
                                  : isUserChoice && !isCorrect
                                  ? "bg-rose-500 text-white"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="pt-0.5">{option}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                            {isUserChoice && (
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                                }`}
                              >
                                Your Answer
                              </span>
                            )}
                            {isCorrectChoice && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                <Check className="w-3 h-3" /> Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  {q.explanation && (
                    <div className="p-3.5 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-blue-400 text-[11px] uppercase tracking-wider block">
                        Official Explanation:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
