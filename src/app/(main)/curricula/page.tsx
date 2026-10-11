"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Search,
  Filter,
  Trophy,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";
import { getAircraftGrouped } from "@/lib/aircraft";

export default function CurriculaCatalogPage() {
  const [curricula, setCurricula] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const aircraftGroups = getAircraftGrouped();

  useEffect(() => {
    fetch("/api/curricula")
      .then((r) => r.json())
      .then((data) => {
        if (data.curricula) setCurricula(data.curricula);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCurricula = curricula.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAircraft = !selectedAircraft || c.aircraft === selectedAircraft;
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    return matchesSearch && matchesAircraft && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              Aviation Academy & Training Pathways
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Cabin Crew Curricula Tracks
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              End-to-end structured curricula covering essential manuals, aircraft modules, practice quizzes, and graduation finals.
            </p>
          </div>

          <Link
            href="/curricula/create"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 shrink-0 transition-all self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            Craft New Curriculum
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search curricula by title, aircraft, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <select
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="Initial Training">Initial Training</option>
            <option value="Type Rating Conversion">Type Rating Conversion</option>
            <option value="Recurrent Assessment">Recurrent Assessment</option>
            <option value="Senior Cabin Crew / Purser">Senior Cabin Crew / Purser</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <PlaneLoader text="Loading flight academy tracks..." size="md" variant="fly" />
        </div>
      ) : filteredCurricula.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Curricula Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No training curricula matched your filter criteria. Instructors and administrators can craft a new curriculum using the button above.
          </p>
          <Link
            href="/curricula/create"
            className="btn-primary inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            Create the First Curriculum
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCurricula.map((curr) => {
            const modulesCount = (curr.modules || []).length;
            const progress = curr.user_progress;
            const isGraduated = progress?.status === "completed";
            const isEnrolled = !!progress;

            return (
              <div
                key={curr.id}
                className="glass-card p-6 rounded-3xl border border-slate-800/80 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                      {curr.category || "Initial Training"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {curr.estimated_duration || "4 Weeks"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                      {curr.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{curr.aircraft || "General Fleet"}</span>
                      <span>•</span>
                      <span>{curr.airline || "Global Aviation"}</span>
                    </div>
                  </div>

                  {curr.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {curr.description}
                    </p>
                  )}

                  {/* Highlights */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Curriculum Modules:</span>
                      <span className="font-bold text-white">{modulesCount} Modules</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Optional Finals:</span>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        {curr.has_safety_final && (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            Safety
                          </span>
                        )}
                        {curr.has_service_final && (
                          <span className="text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            Service
                          </span>
                        )}
                        {curr.has_school_final && (
                          <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Grand
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Progress & Enter CTA */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  {isEnrolled && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className={isGraduated ? "text-emerald-400 flex items-center gap-1" : "text-slate-300"}>
                          {isGraduated && <Trophy className="w-3.5 h-3.5" />}
                          {isGraduated ? "Graduated" : "Course Progress"}
                        </span>
                        <span className="text-blue-400 font-mono">
                          {progress.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all ${
                            isGraduated ? "bg-emerald-400" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                          style={{ width: `${progress.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/curricula/${curr.id}`}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isGraduated
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : isEnrolled
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
                    }`}
                  >
                    <span>{isGraduated ? "View Graduation Record" : isEnrolled ? "Resume Curriculum" : "Enter Curriculum"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
