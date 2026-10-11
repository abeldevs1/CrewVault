"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, BookOpen, GraduationCap, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-1">
            <Bell className="w-3.5 h-3.5" />
            Targeted Notification System
          </div>
          <h1 className="text-2xl font-extrabold text-white">Notifications</h1>
          <p className="text-xs text-slate-400">Updates on new aircraft materials, exam releases, approvals, and results.</p>
        </div>

        <button
          onClick={() => markAsRead()}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <CheckCheck className="w-4 h-4 text-sky-400" />
          Mark All as Read
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center text-xs text-slate-400 space-y-2">
          <Bell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">All Caught Up</h3>
          <p>No unread notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !n.is_read ? "border-sky-500/40 bg-sky-500/5" : "border-slate-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                    {n.category}
                  </span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
                  <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>

                <h3 className="text-xs font-bold text-white">{n.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-sky-400 text-xs font-semibold rounded-xl flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-900 rounded-xl"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
