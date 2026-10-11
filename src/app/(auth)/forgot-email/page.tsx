"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plane, Search, Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import PlaneLoader from "@/components/PlaneLoader";

export default function ForgotEmailPage() {
  const [fullName, setFullName] = useState("");
  const [airline, setAirline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/auth/forgot-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          airline: airline.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search for account");
      }

      setResults(data.accounts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050a12] relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 space-y-6 relative z-10 shadow-2xl">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-white">Find Your Registered Email</h1>
          <p className="text-xs text-slate-400">
            Enter your name and airline operator to locate your CrewVault login address.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Registered Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Turner"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Airline / Operator (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Global Airways, Skyways"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <PlaneLoader text="Searching database..." size="sm" variant="fly" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Find Account Email
              </>
            )}
          </button>
        </form>

        {/* Results Card */}
        {results !== null && (
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            {results.length === 0 ? (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No matching accounts found. Please check spelling or contact your airline training administrator.
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Matching Accounts Found:
                </span>

                {results.map((acc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{acc.full_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Member since {acc.registered_year}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Login Email:</span>
                      <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {acc.masked_email}
                      </span>
                    </div>

                    {acc.airline && (
                      <div className="text-[10px] text-slate-500">
                        Airline: {acc.airline}
                      </div>
                    )}

                    <Link
                      href="/login"
                      className="inline-block pt-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4"
                    >
                      Proceed to Login with this email &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
