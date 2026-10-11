"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Search, Bell, LogOut, User as UserIcon, Shield, Sparkles, Brain, Menu, X, Trophy, Award, BookOpen, GraduationCap, Users } from "lucide-react";
import { User } from "@/types";
import { RoleBadge } from "./RoleBadge";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const unread = data.notifications.filter((n: any) => !n.is_read).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link href={user ? "/for-you" : "/"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-400 transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CREW<span className="text-blue-400">VAULT</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 block -mt-1 uppercase">
              Cabin Crew Platform
            </span>
          </div>
        </Link>

        {/* Global Search Bar (PC) */}
        {user && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Q400 doors, CPR, safety, exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </form>
        )}

        {/* User Navigation / Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Mobile Quick Search Button */}
              <Link
                href="/search"
                className="md:hidden p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50 rounded-xl transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Notifications Link */}
              <Link
                href="/notifications"
                className="relative p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold bg-blue-500 text-white rounded-full glow-sky animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:block pr-1">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {user.full_name}
                    </div>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <RoleBadge role={user.role} size="sm" />
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      My Dashboard
                    </Link>

                    <Link
                      href="/recall"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                    >
                      <Brain className="w-4 h-4 text-indigo-400" />
                      Recall Studio (TypeToMemorize)
                    </Link>

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Console
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-slate-800/80 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50 rounded-xl transition-colors ml-1"
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {showMobileMenu && user && (
        <div className="md:hidden border-t border-slate-800/80 mt-3 pt-3 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <Link
            href="/recall"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center justify-between p-3 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Recall Studio (TypeToMemorize)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] uppercase font-bold text-indigo-300">
              Active Recall
            </span>
          </Link>

          <Link
            href="/school-final"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 text-xs font-medium transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>School Final Hub</span>
          </Link>

          <Link
            href="/curricula"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 text-xs font-medium transition-colors"
          >
            <Award className="w-4 h-4 text-blue-400" />
            <span>Curricula Pathways</span>
          </Link>

          <Link
            href="/materials"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 text-xs font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Study Materials Vault</span>
          </Link>

          <Link
            href="/exams"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 text-xs font-medium transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Examination Hub</span>
          </Link>

          <Link
            href="/discussions"
            onClick={() => setShowMobileMenu(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 text-slate-300 text-xs font-medium transition-colors"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Study Groups & Chat</span>
          </Link>
        </div>
      )}
    </header>
  );
}
