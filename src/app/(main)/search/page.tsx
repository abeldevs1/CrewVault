"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  BookOpen,
  HelpCircle,
  FileText,
  Sparkles,
  Plane,
  Layers,
  CheckCircle2,
  Filter,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { getAircraftGrouped } from "@/lib/aircraft";
import { CABIN_CREW_SUBJECTS } from "@/lib/subjects";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "materials" | "questions">("all");
  const [materialResults, setMaterialResults] = useState<any[]>([]);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aircraftFilter, setAircraftFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const aircraftGroups = getAircraftGrouped();

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        type: activeTab,
      });
      if (aircraftFilter) params.append("aircraft", aircraftFilter);
      if (subjectFilter) params.append("subject", subjectFilter);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (data.results) {
        setMaterialResults(data.results);
      } else {
        setMaterialResults([]);
      }
      if (data.questions) {
        setQuestionResults(data.questions);
      } else {
        setQuestionResults([]);
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (query.trim()) {
      handleSearch(query);
    }
  }, [activeTab, aircraftFilter, subjectFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const totalResultsCount = materialResults.length + questionResults.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Search Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Full-Text Deep Search (Google-Style)
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Searches inside all uploaded documents, PDFs, PPTXs & questions
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Knowledge Search Engine
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Find any keyword, checklist phrase, safety procedure, door protocol, or exam question across the entire vault.
          </p>
        </div>

        {/* Big Search Input */}
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type any word: 'decompression', 'Q400 type IV door', 'first aid CPR', 'DGR dry ice'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-28 py-3.5 md:py-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="shrink-0 font-medium">Refine by:</span>
          </div>

          <select
            value={aircraftFilter}
            onChange={(e) => setAircraftFilter(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
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
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="">All Subject Categories</option>
            {CABIN_CREW_SUBJECTS.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {(aircraftFilter || subjectFilter) && (
            <button
              type="button"
              onClick={() => {
                setAircraftFilter("");
                setSubjectFilter("");
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-center underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Results ({totalResultsCount})
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "materials"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study Materials ({materialResults.length})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "questions"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white bg-slate-900/60"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Question Bank ({questionResults.length})
          </button>
        </div>
      )}

      {/* Search Content Body */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <PlaneLoader text="Searching inside manuals, slides and question banks..." size="md" variant="fly" />
        </div>
      ) : !query ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">Ready to search</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Type any term above to search through all document text, emergency procedures, slide contents, and mock exam questions.
          </p>
        </div>
      ) : totalResultsCount === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No results found for &ldquo;{query}&rdquo;</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn&apos;t find matching text in any uploaded study guides or question banks. Try broader terms or remove aircraft/subject filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Material Results Section */}
          {(activeTab === "all" || activeTab === "materials") && materialResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Study Materials & Manuals ({materialResults.length})
                </span>
              </div>

              {materialResults.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.material_type === "Previous Exam"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.material_type}
                        </span>
                        {item.aircraft && (
                          <span className="text-[10px] text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.aircraft}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">• {item.subject}</span>
                      </div>

                      <Link href={`/materials/${item.id}`} className="block group">
                        <h3 className="text-sm md:text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                          {item.title}
                        </h3>
                      </Link>

                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/materials/${item.id}`}
                      className="btn-primary self-start text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open Document</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Google-like Snippet with Highlight */}
                  {item.content_snippet && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                        Matched inside document content:
                      </span>
                      <div
                        className="[&>mark]:bg-amber-400/20 [&>mark]:text-amber-300 [&>mark]:px-1 [&>mark]:py-0.5 [&>mark]:rounded [&>mark]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: item.content_snippet }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Question Results Section */}
          {(activeTab === "all" || activeTab === "questions") && questionResults.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Matching Exam Questions ({questionResults.length})
                </span>
              </div>

              {questionResults.map((q) => (
                <div
                  key={q.id}
                  className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Question
                      </span>
                      {q.topic && (
                        <span className="text-[10px] text-slate-300 font-medium">
                          {q.topic}
                        </span>
                      )}
                      {q.aircraft && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {q.aircraft}
                        </span>
                      )}
                    </div>
                    {q.source_material_id && (
                      <Link
                        href={`/materials/${q.source_material_id}`}
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Source Material &rarr;
                      </Link>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options Preview */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt: string, idx: number) => {
                        const optKey = String.fromCharCode(65 + idx);
                        const isCorrect = q.correct_answer === optKey;
                        return (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-xl text-xs border ${
                              isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                                : "bg-slate-900/60 border-slate-800 text-slate-400"
                            }`}
                          >
                            <span className="font-bold mr-1.5">{optKey}.</span> {opt}
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline ml-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-900">
                      <span className="font-bold text-slate-300 not-italic">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center">
          <PlaneLoader text="Loading search..." size="md" variant="fly" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
