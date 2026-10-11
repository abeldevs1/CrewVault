"use client";

import React, { useState, useEffect } from "react";
import { Layers, AlertTriangle, HardDrive, ShieldCheck, User } from "lucide-react";

export default function StorageGovernancePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((json) => {
        if (json.storage) setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading storage analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-xs text-slate-400">Access restricted.</div>;
  }

  const { storage, top_storage_users } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          Cloudflare R2 Object Storage Governance
        </div>
        <h1 className="text-2xl font-extrabold text-white">Global Storage Monitor & Quota</h1>
        <p className="text-xs text-slate-400">
          Monitor per-member quotas (500 MB limit), daily upload thresholds (5 files/day), and global storage limits (10 GB).
        </p>
      </div>

      {/* Global Visual Storage Gauge */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              R2 Storage Usage
            </h2>
            <div className="text-2xl font-extrabold text-sky-400">
              {storage.used_gb} GB / {storage.limit_gb} GB
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-mono font-bold">
            {storage.usage_percentage}% Capacity
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              storage.warning_triggered
                ? "bg-gradient-to-r from-amber-500 to-rose-500 glow-amber"
                : "bg-gradient-to-r from-sky-400 via-indigo-500 to-cyan-400 glow-sky"
            }`}
            style={{ width: `${Math.min(100, parseFloat(storage.usage_percentage))}%` }}
          />
        </div>

        {storage.warning_triggered && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>WARNING: Global R2 storage capacity is approaching the configured 10 GB limit threshold.</span>
          </div>
        )}
      </div>

      {/* Top Storage Consuming Members */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          Member Storage Consumptions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Files Uploaded</th>
                <th className="py-2.5 px-3">Storage Consumed</th>
                <th className="py-2.5 px-3">Quota Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {top_storage_users?.map((u: any) => {
                const usedMB = (u.total_bytes / (1024 * 1024)).toFixed(1);
                return (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {u.full_name} ({u.email})
                    </td>
                    <td className="py-2.5 px-3 font-mono">{u.file_count} files</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400">{usedMB} MB / 500 MB</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        Within Quota
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
