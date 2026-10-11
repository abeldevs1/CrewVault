"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Shield,
  Briefcase,
  Brain,
  FlameKindling,
  AlarmClock,
  Zap,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Star,
  Plane,
  Wind,
  Siren,
  Coffee,
  Users,
  Award,
  AlertTriangle,
  ClipboardList,
  Activity,
  FileText,
  ExternalLink,
  UploadCloud,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Play,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";

const SAFETY_TOPICS = [
  {
    id: "saf-1",
    title: "Safety Modules",
    icon: Shield,
    color: "rose",
    desc: "Core safety theory, responsibilities, and procedures",
    topics: ["CRM & Human Factors", "SMS", "Crew Coordination", "Emergency Procedures Overview"],
  },
  {
    id: "saf-2",
    title: "Dangerous Goods (DGR)",
    icon: AlertTriangle,
    color: "amber",
    desc: "Classification, identification, and handling of dangerous goods",
    topics: ["IATA DGR Classes 1–9", "Passenger Declaration", "Forbidden Items", "Spillage Procedures"],
  },
  {
    id: "saf-3",
    title: "Cabin Doors",
    icon: Wind,
    color: "sky",
    desc: "Door operation, arming/disarming, and emergency exits",
    topics: ["Door Arming/Disarming", "Emergency Exit Operation", "Slide Deployment", "Ditching Procedures"],
  },
  {
    id: "saf-4",
    title: "Aircraft Specific",
    icon: Plane,
    color: "indigo",
    desc: "Q400 & A320 equipment, layouts, and procedures",
    topics: ["Q400 Emergency Equipment", "A320 Cabin Layout", "Fire Extinguishers", "Oxygen Systems"],
  },
  {
    id: "saf-5",
    title: "Evacuation Commands",
    icon: Siren,
    color: "red",
    desc: "Brace commands, evacuation calls, and crowd control",
    topics: [
      '"BRACE BRACE BRACE"',
      '"HEADS DOWN STAY DOWN"',
      '"EVACUATE EVACUATE"',
      "Crowd Control Commands",
    ],
  },
  {
    id: "saf-6",
    title: "Emergency Equipment Drill",
    icon: FlameKindling,
    color: "orange",
    desc: "Hands-on equipment identification and usage",
    topics: ["Life Vests & Infants", "Fire Extinguisher Types", "Oxygen Cylinders", "Crash Axe & Torch"],
  },
];

const SERVICE_TOPICS = [
  {
    id: "svc-1",
    title: "Service Modules",
    icon: Briefcase,
    color: "blue",
    desc: "Full service sequence from boarding to landing",
    topics: ["Pre-boarding Checks", "Boarding & Welcome", "Meal Service Sequence", "Duty-Free & Arrivals"],
  },
  {
    id: "svc-2",
    title: "Service Sequence",
    icon: ClipboardList,
    color: "teal",
    desc: "Detailed step-by-step beverage and meal flow",
    topics: [
      "HLM Day & Night Sequences",
      "LCH Cocktail & Early Morning SDW",
      "DUR (Before & After 21:00)",
      "Special Meals & Golden Rule",
    ],
  },
  {
    id: "svc-3",
    title: "ShebaMiles & Loyalty",
    icon: Star,
    color: "amber",
    desc: "Tier benefits, baggage allowances, and passenger recognition",
    topics: ["Classic, Silver, Gold, Platinum", "Baggage Allowances", "Lounge Access Rules", "Priority Boarding"],
  },
  {
    id: "svc-4",
    title: "Service Mock-up Assessment",
    icon: Award,
    color: "purple",
    desc: "Simulated galley and cabin mock-up evaluation",
    topics: ["Galley Setup & Safety", "Trolley Management", "Customer Interaction", "Handling Service Delays"],
  },
  {
    id: "svc-5",
    title: "Special Passenger Handling",
    icon: Users,
    color: "emerald",
    desc: "PRM, UM, infant bassinet, and medical cases",
    topics: ["Unaccompanied Minors (UM)", "Passengers with Reduced Mobility (PRM)", "Infant Bassinet Rules", "Medical Clearances"],
  },
  {
    id: "svc-6",
    title: "Customs & Immigration",
    icon: FileText,
    color: "cyan",
    desc: "Arrival declarations, general declarations, and quarantine",
    topics: ["General Declaration (GenDec)", "Landing Cards Distribution", "Quarantine Procedures", "Disinsection Regulations"],
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/25", text: "text-rose-400", iconBg: "bg-rose-500/20" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-400", iconBg: "bg-amber-500/20" },
  sky: { bg: "bg-sky-500/10", border: "border-sky-500/25", text: "text-sky-400", iconBg: "bg-sky-500/20" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/25", text: "text-indigo-400", iconBg: "bg-indigo-500/20" },
  red: { bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-400", iconBg: "bg-red-500/20" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/25", text: "text-orange-400", iconBg: "bg-orange-500/20" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-400", iconBg: "bg-blue-500/20" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/25", text: "text-teal-400", iconBg: "bg-teal-500/20" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/25", text: "text-purple-400", iconBg: "bg-purple-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-400", iconBg: "bg-cyan-500/20" },
};

function TopicCard({ topic }: { topic: (typeof SAFETY_TOPICS)[0] }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[topic.color] || colorMap.blue;
  const Icon = topic.icon;

  return (
    <div className={`glass-card rounded-2xl border ${c.border} ${c.bg} overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
      <button className="w-full p-5 text-left flex items-start gap-4" onClick={() => setOpen((o) => !o)}>
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold ${c.text}`}>{topic.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{topic.desc}</p>
        </div>
        <ChevronRight
          className={`w-4 h-4 ${c.text} shrink-0 mt-1 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2 animate-slide-up">
          <div className="h-px bg-white/[0.05] mb-3" />
          {topic.topics.map((t) => (
            <div key={t} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300">{t}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-3">
            <Link
              href={`/exams?category=${encodeURIComponent(topic.title)}`}
              className="flex-1 py-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded-xl text-center text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Practice Exam
            </Link>
            <Link
              href="/recall"
              className={`flex-1 py-2 ${c.bg} hover:opacity-80 border ${c.border} rounded-xl text-center text-xs font-semibold ${c.text} transition-all flex items-center justify-center gap-1.5`}
            >
              <Brain className="w-3.5 h-3.5" />
              Recall Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchoolFinalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"safety" | "service" | "strategy">("safety");
  const [safetyMaterials, setSafetyMaterials] = useState<any[]>([]);
  const [serviceMaterials, setServiceMaterials] = useState<any[]>([]);
  const [safetyExams, setSafetyExams] = useState<any[]>([]);
  const [serviceExams, setServiceExams] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  // Generate Exam Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTrack, setGenTrack] = useState<"Safety Final" | "Service Final">("Safety Final");
  const [genCount, setGenCount] = useState(25);
  const [genTime, setGenTime] = useState(30);
  const [genLoading, setGenLoading] = useState(false);

  const isManagerOrAdmin = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.user);
      }
    } catch (_) {}
  };

  const fetchMaterialsAndExams = async () => {
    setMaterialsLoading(true);
    try {
      const [safetyMatRes, serviceMatRes, bothMatRes, safetyExRes, serviceExRes] = await Promise.all([
        fetch("/api/materials?school_final_category=Safety+Final"),
        fetch("/api/materials?school_final_category=Service+Final"),
        fetch("/api/materials?school_final_category=Both"),
        fetch("/api/exams?school_final_track=Safety+Final"),
        fetch("/api/exams?school_final_track=Service+Final"),
      ]);

      const safetyData = safetyMatRes.ok ? await safetyMatRes.json() : { materials: [] };
      const serviceData = serviceMatRes.ok ? await serviceMatRes.json() : { materials: [] };
      const bothData = bothMatRes.ok ? await bothMatRes.json() : { materials: [] };
      const safetyExData = safetyExRes.ok ? await safetyExRes.json() : { exams: [] };
      const serviceExData = serviceExRes.ok ? await serviceExRes.json() : { exams: [] };

      const bothMats = bothData.materials || [];
      setSafetyMaterials([...(safetyData.materials || []), ...bothMats]);
      setServiceMaterials([...(serviceData.materials || []), ...bothMats]);
      setSafetyExams(safetyExData.exams || []);
      setServiceExams(serviceExData.exams || []);
    } catch (e) {
      // Non-fatal
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchMaterialsAndExams();
  }, []);

  // Toggle publish state for material
  const togglePublishMaterial = async (e: React.MouseEvent, matId: string, currentPublished: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/materials/${matId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentPublished }),
      });
      if (res.ok) {
        fetchMaterialsAndExams();
      }
    } catch (_) {}
  };

  // Toggle publish state for exam
  const togglePublishExam = async (e: React.MouseEvent, examId: string, currentPublished: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentPublished }),
      });
      if (res.ok) {
        fetchMaterialsAndExams();
      }
    } catch (_) {}
  };

  // Generate School Final Exam
  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    try {
      const catKey = genTrack === "Safety Final" ? "safety_final" : "service_final";
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_category: catKey,
          school_final_track: genTrack,
          question_count: genCount,
          time_limit_minutes: genTime,
          is_published: 1, // Admin published by default or can toggle
          mode: "ai",
          title: `Official ${genTrack} Examination (${genCount} Questions)`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowGenModal(false);
        fetchMaterialsAndExams();
        if (data.session_id) {
          router.push(`/exam-session/${data.session_id}`);
        }
      }
    } catch (err: any) {
      alert("Failed to generate exam: " + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const tabs = [
    { id: "safety", label: "Safety Final", icon: Shield, color: "text-rose-400" },
    { id: "service", label: "Service Final", icon: Coffee, color: "text-blue-400" },
    { id: "strategy", label: "Study Strategy", icon: Brain, color: "text-indigo-400" },
  ] as const;

  const MaterialCard = ({ material }: { material: any }) => {
    const isPublished = material.is_published !== 0;
    const bundleCount = material.bundle_file_count || 1;

    return (
      <Link
        href={`/materials/${material.id}`}
        className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0">
            {bundleCount > 1 ? (
              <Layers className="w-4 h-4 text-indigo-400" />
            ) : (
              <FileText className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
              {material.title}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">
                {material.material_type || "Document"}
              </span>
              {bundleCount > 1 && (
                <span className="text-[10px] text-indigo-400 font-semibold">{bundleCount} files</span>
              )}
              {isManagerOrAdmin && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    isPublished
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {isPublished ? "Visible to Trainees" : "Draft / Hidden"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={(e) => togglePublishMaterial(e, material.id, isPublished)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isPublished
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
              title={isPublished ? "Hide from regular trainees" : "Publish to regular trainees"}
            >
              {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </Link>
    );
  };

  const ExamCard = ({ exam }: { exam: any }) => {
    const isPublished = exam.is_published !== 0;

    return (
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Official Assessment
            </span>
            {isManagerOrAdmin && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  isPublished
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}
              >
                {isPublished ? "Published" : "Draft / Hidden"}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white line-clamp-1">{exam.title}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {exam.description || "Official examination curriculum."}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ClipboardList className="w-3 h-3 text-slate-500" />
              {exam.total_questions} Questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {exam.time_limit_minutes} Mins
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <Link
            href={`/exams/${exam.id}/start`}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Take Exam</span>
          </Link>
          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={(e) => togglePublishExam(e, exam.id, isPublished)}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isPublished ? "Hide from students" : "Share to students"}
            >
              {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden glass-panel rounded-3xl border border-amber-500/20 p-6 md:p-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 shrink-0">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-extrabold tracking-widest text-amber-400/80 uppercase">
                Line Indoc Prep
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              School Final <span className="text-amber-400">Hub</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Your official examination and drill center for the <strong className="text-slate-200">Safety Final</strong>{" "}
              and <strong className="text-slate-200">Service Final</strong>. Review curated instructor materials,
              publish mock exams, and test line indoc readiness.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/recall"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <Brain className="w-4 h-4" />
              Open Recall Studio
            </Link>
            <Link
              href="/exams"
              className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              Practice Exams
            </Link>
          </div>
        </div>

        {/* Exam Summary Cards */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Safety Topics", value: SAFETY_TOPICS.length, icon: Shield, color: "rose" },
            { label: "Service Topics", value: SERVICE_TOPICS.length, icon: Briefcase, color: "blue" },
            { label: "Safety Exams", value: safetyExams.length, icon: GraduationCap, color: "emerald" },
            { label: "Service Exams", value: serviceExams.length, icon: Award, color: "purple" },
          ].map((stat) => {
            const Icon = stat.icon;
            const c = colorMap[stat.color] || colorMap.blue;
            return (
              <div key={stat.label} className={`p-4 rounded-2xl ${c.bg} border ${c.border} text-center`}>
                <Icon className={`w-5 h-5 ${c.text} mx-auto mb-1.5`} />
                <div className={`text-xl font-extrabold ${c.text}`}>{stat.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Admin Action Bar (Only for Managers / Admins) ─── */}
      {isManagerOrAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              Instructor & Admin School Final Controls
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setGenTrack(activeTab === "service" ? "Service Final" : "Safety Final");
                setShowGenModal(true);
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Final Exam</span>
            </button>
            <Link
              href={`/materials/upload?school_final_category=${activeTab === "service" ? "Service Final" : "Safety Final"}`}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload Final Material</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 p-1 glass-panel rounded-2xl border border-white/[0.06] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Safety Tab ─── */}
      {activeTab === "safety" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Safety Final Track</h2>
              <p className="text-xs text-slate-400">
                Covers safety modules, DGR, cabin doors, aircraft-specific systems, evacuation commands, and emergency equipment drills.
              </p>
            </div>
          </div>

          {/* Practical Drill Alert */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <Siren className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-rose-300">Practical Drill Required</div>
              <div className="text-xs text-slate-400 mt-0.5">
                The safety final includes a <strong className="text-slate-200">hands-on evacuation drill</strong> with
                verbal commands and <strong className="text-slate-200">emergency equipment identification</strong>.
                Use the Recall Studio to master exact equipment specs and commands.
              </div>
            </div>
          </div>

          {/* Official Safety Final Mock Exams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Official Safety Final Examinations ({safetyExams.length})
              </h3>
              {isManagerOrAdmin && (
                <button
                  onClick={() => {
                    setGenTrack("Safety Final");
                    setShowGenModal(true);
                  }}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Safety Exam
                </button>
              )}
            </div>

            {safetyExams.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No official safety final exams published yet. Instructors can generate and publish exams above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {safetyExams.map((ex) => (
                  <ExamCard key={ex.id} exam={ex} />
                ))}
              </div>
            )}
          </div>

          {/* Curated Safety Materials Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Curated Safety Study Materials</h3>
                {safetyMaterials.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {safetyMaterials.length}
                  </span>
                )}
              </div>
              <Link
                href="/materials/upload?school_final_category=Safety Final"
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Material
              </Link>
            </div>

            {materialsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500 glass-panel rounded-2xl">
                Loading safety materials...
              </div>
            ) : safetyMaterials.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl border border-dashed border-white/10 flex items-center justify-between">
                <span>No safety materials uploaded yet.</span>
                <Link href="/materials/upload" className="text-rose-400 hover:underline font-semibold">
                  Upload Safety Document →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {safetyMaterials.map((mat) => (
                  <MaterialCard key={mat.id} material={mat} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
            {SAFETY_TOPICS.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Service Tab ─── */}
      {activeTab === "service" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Service Final Track</h2>
              <p className="text-xs text-slate-400">
                Covers service modules, trolley loading, beverage and meal sequences, ShebaMiles, and service mock-up assessments.
              </p>
            </div>
          </div>

          {/* Service Mock-up Alert */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-blue-300">Service Mock-up Assessment</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Assessed on full <strong className="text-slate-200">inflight service sequence</strong> in a simulated galley.
                Review trolley loading, meal tray assembly, and beverage order.
              </div>
            </div>
          </div>

          {/* Official Service Final Mock Exams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                Official Service Final Examinations ({serviceExams.length})
              </h3>
              {isManagerOrAdmin && (
                <button
                  onClick={() => {
                    setGenTrack("Service Final");
                    setShowGenModal(true);
                  }}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Service Exam
                </button>
              )}
            </div>

            {serviceExams.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No official service final exams published yet. Instructors can generate and publish exams above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {serviceExams.map((ex) => (
                  <ExamCard key={ex.id} exam={ex} />
                ))}
              </div>
            )}
          </div>

          {/* Curated Service Materials Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Curated Service Study Materials</h3>
                {serviceMaterials.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {serviceMaterials.length}
                  </span>
                )}
              </div>
              <Link
                href="/materials/upload?school_final_category=Service Final"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Material
              </Link>
            </div>

            {materialsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500 glass-panel rounded-2xl">
                Loading service materials...
              </div>
            ) : serviceMaterials.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl border border-dashed border-white/10 flex items-center justify-between">
                <span>No service materials uploaded yet.</span>
                <Link href="/materials/upload" className="text-blue-400 hover:underline font-semibold">
                  Upload Service Document →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {serviceMaterials.map((mat) => (
                  <MaterialCard key={mat.id} material={mat} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
            {SERVICE_TOPICS.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Strategy Tab ─── */}
      {activeTab === "strategy" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Study Strategy & Timeline</h2>
              <p className="text-xs text-slate-400">
                A structured week-by-week approach to ace both safety and service school finals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                phase: "Week 1",
                title: "Theory Foundation",
                icon: BookOpen,
                color: "sky",
                steps: [
                  "Read all Safety Modules twice",
                  "Memorize DGR classes and forbidden items",
                  "Study door operation sequences",
                  "Review service sequence end-to-end",
                ],
              },
              {
                phase: "Week 2",
                title: "Active Recall",
                icon: Brain,
                color: "indigo",
                steps: [
                  "Use Recall Studio daily — 30 mins",
                  "Type out evacuation commands from memory",
                  "Quiz yourself on ShebaMiles tiers",
                  "Practice emergency equipment positions",
                ],
              },
              {
                phase: "Week 3",
                title: "Mock Exams",
                icon: GraduationCap,
                color: "emerald",
                steps: [
                  "Complete 2 Safety practice exams daily",
                  "Complete 2 Service practice exams daily",
                  "Review wrong answers immediately",
                  "Re-test weak areas with targeted exam",
                ],
              },
              {
                phase: "Final Days",
                title: "Drill & Polish",
                icon: Zap,
                color: "amber",
                steps: [
                  "Verbal evacuation drill with colleague",
                  "Timed service sequence run-through",
                  "Flash-card review of emergency equipment",
                  "Confidence-check exam — aim ≥ 85%",
                ],
              },
            ].map((phase) => {
              const Icon = phase.icon;
              const c = colorMap[phase.color] || colorMap.blue;
              return (
                <div key={phase.phase} className={`glass-card rounded-2xl border ${c.border} p-5 space-y-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg ${c.bg} text-[10px] font-extrabold ${c.text} uppercase tracking-wider`}>
                      {phase.phase}
                    </div>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                    <h3 className="text-sm font-bold text-white">{phase.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {phase.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <span className={`text-[10px] font-bold ${c.text} shrink-0 mt-0.5`}>{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL: AI FINAL EXAM GENERATOR ─── */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 max-w-md w-full space-y-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Generate Final Exam with AI</h3>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateExam} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">Target Track</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenTrack("Safety Final")}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTrack === "Safety Final"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Safety Final
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenTrack("Service Final")}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTrack === "Service Final"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    Service Final
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">Questions Count</label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={15}>15 Questions</option>
                    <option value={25}>25 Questions</option>
                    <option value={35}>35 Questions</option>
                    <option value={50}>50 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[10px]">Time Limit</label>
                  <select
                    value={genTime}
                    onChange={(e) => setGenTime(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                Exam will be published directly under the official <strong>{genTrack}</strong> curriculum for students to test their recall.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
                >
                  {genLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Exam...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Launch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
