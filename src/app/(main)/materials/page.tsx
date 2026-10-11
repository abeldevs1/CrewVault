"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, FileUp, Search, Eye, ChevronRight, FileQuestion, Layers, Shield, Coffee } from "lucide-react";
import { Material } from "@/types";
import { getAircraftGrouped } from "@/lib/aircraft";
import { CABIN_CREW_SUBJECTS, MATERIAL_TYPES } from "@/lib/subjects";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedFinalCat, setSelectedFinalCat] = useState("");

  const aircraftGroups = getAircraftGrouped();

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedAircraft) params.append("aircraft", selectedAircraft);
      if (selectedType) params.append("material_type", selectedType);
      if (selectedSubject) params.append("subject", selectedSubject);
      if (selectedFinalCat) params.append("school_final_category", selectedFinalCat);

      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      if (data.materials) {
        setMaterials(data.materials);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search, selectedAircraft, selectedType, selectedSubject, selectedFinalCat]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            Study Materials & Cabin Safety Repository
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Aviation Material Vault</h1>
          <p className="text-xs md:text-sm text-slate-400">
            Browse aircraft procedures, inflight service guides, dangerous goods regulations, previous exam papers, and formatted Markdown.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/exams/upload"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <FileQuestion className="w-4 h-4" />
            Upload Previous Exam
          </Link>

          <Link
            href="/materials/upload"
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <FileUp className="w-4 h-4" />
            Upload Study Material
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles, aircraft, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        <select
          value={selectedAircraft}
          onChange={(e) => setSelectedAircraft(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Material Types</option>
          {MATERIAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Subjects</option>
          {CABIN_CREW_SUBJECTS.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedFinalCat}
          onChange={(e) => setSelectedFinalCat(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Target Finals</option>
          <option value="Safety Final">Safety Final</option>
          <option value="Service Final">Service Final</option>
          <option value="Both">Both (Safety & Service)</option>
        </select>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Loading study materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Study Materials Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your aircraft or subject filters, or be the first to upload a study guide or exam paper!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((item) => (
            <div
              key={item.id}
              className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-sky-500/40 transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.material_type === "Previous Exam"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      }`}
                    >
                      {item.material_type}
                    </span>
                    {(item as any).school_final_category && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                          (item as any).school_final_category === "Safety Final"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : (item as any).school_final_category === "Service Final"
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {(item as any).school_final_category === "Safety Final" ? (
                          <Shield className="w-2.5 h-2.5" />
                        ) : (
                          <Coffee className="w-2.5 h-2.5" />
                        )}
                        {(item as any).school_final_category}
                      </span>
                    )}
                    {((item as any).bundle_file_count ?? 1) > 1 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {(item as any).bundle_file_count} files
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.aircraft || "General Fleet"}
                  </span>
                </div>

                <Link href={`/materials/${item.id}`} className="block group-hover:text-sky-300 transition-colors">
                  <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || "No detailed description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {item.views_count}
                  </span>
                  <span className="truncate max-w-[130px]">{item.subject}</span>
                </div>

                <Link
                  href={`/materials/${item.id}`}
                  className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  View
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
