"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Lock, Mail, User as UserIcon, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { UserRole } from "@/types";
import { POPULAR_AIRCRAFT_KEYS } from "@/lib/aircraft";
import { isValidEmail } from "@/lib/validation/email";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [airline, setAirline] = useState("Global Airways");
  const [aircraft, setAircraft] = useState<string[]>([
    "General / All Fleet (Non-Aircraft Specific)",
    "Boeing 787-9 Dreamliner",
    "Airbus A380-800",
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleAircraft = (item: string) => {
    setAircraft((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address with a valid domain (e.g. name@airline.com)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          airline,
          aircraft_studied: aircraft,
          subjects_studied: [
            "Inflight Service & Hospitality",
            "Aviation First Aid & Medical",
            "Dangerous Goods Regulations (DGR)",
            "Cabin Doors, Exits & Escape Slides",
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account");
      }

      router.push("/for-you");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 p-0.5 mb-4 glow-sky">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Plane className="w-7 h-7 text-sky-400 transform -rotate-45" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Join CrewVault Platform</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access study guides, previous exams, question banks & adaptive practice
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="crew@airline.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    email.length > 3
                      ? isValidEmail(email)
                        ? "border-emerald-500/60 focus:border-emerald-500"
                        : "border-rose-500/60 focus:border-rose-500"
                      : "border-slate-800 focus:border-blue-500"
                  }`}
                />
                {email.length > 3 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isValidEmail(email) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-rose-400 font-mono">Invalid</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Airline / Academy</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Emirates, Qantas, Aviation Academy"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Role selection for onboarding testing */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("MEMBER")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "MEMBER"
                    ? "border-sky-500 bg-sky-500/10 text-sky-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">MEMBER</div>
                  <div className="text-[10px] text-slate-400">Student / Cabin Crew</div>
                </div>
                {role === "MEMBER" && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => setRole("MANAGER")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "MANAGER"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">MANAGER</div>
                  <div className="text-[10px] text-slate-400">Instructor / Moderator</div>
                </div>
                {role === "MANAGER" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Aircraft studied chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Focus Aircraft Fleets</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_AIRCRAFT_KEYS.map((ac) => {
                const selected = aircraft.includes(ac);
                return (
                  <button
                    key={ac}
                    type="button"
                    onClick={() => toggleAircraft(ac)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selected
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {ac}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create CrewVault Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800/80 pt-5">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:underline font-semibold">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
