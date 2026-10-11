"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  FileUp,
  GraduationCap,
  MessageSquare,
  Bookmark,
  Bell,
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  Layers,
  Award,
  Trophy,
  Brain,
  Star,
  ChevronRight,
  Users,
} from "lucide-react";
import { User } from "@/types";

interface SidebarProps {
  user: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  if (!user) return null;

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  const finalsNav = [
    { name: "School Final Hub", href: "/school-final", icon: Trophy, accent: "gold" },
    { name: "Recall Studio", href: "/recall", icon: Brain, accent: "indigo" },
  ];

  const mainNav = [
    { name: "For You", href: "/for-you", icon: Compass },
    { name: "Curricula Tracks", href: "/curricula", icon: Award },
    { name: "Study Materials", href: "/materials", icon: BookOpen },
    { name: "Examination Hub", href: "/exams", icon: GraduationCap },
    { name: "Study Groups & Chat", href: "/discussions", icon: Users },
    { name: "Upload Content", href: "/materials/upload", icon: FileUp },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Community Posts", href: "/posts", icon: MessageSquare },
    { name: "My Library", href: "/dashboard?tab=bookmarks", icon: Bookmark },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const moderationNav = [
    { name: "Moderation Queue", href: "/admin/moderation", icon: ShieldCheck },
  ];

  const adminNav = [
    { name: "Admin Console", href: "/admin", icon: ShieldAlert },
    { name: "Storage Governance", href: "/admin/storage", icon: Layers },
  ];

  const NavLink = ({
    item,
    activeClass,
    inactiveClass,
    iconActive,
  }: {
    item: { name: string; href: string; icon: React.ElementType };
    activeClass: string;
    inactiveClass: string;
    iconActive: string;
  }) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href ||
      (item.href !== "/" &&
        item.href !== "/dashboard" &&
        pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
          isActive ? activeClass : inactiveClass
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${
            isActive ? iconActive : "text-slate-500 group-hover:text-slate-300"
          }`}
        />
        <span className="truncate">{item.name}</span>
        {isActive && (
          <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-50" />
        )}
      </Link>
    );
  };

  return (
    <aside
      className="w-[240px] xl:w-[260px] shrink-0 hidden lg:flex flex-col sticky top-[65px] h-[calc(100vh-65px)] border-r border-white/[0.04]"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,14,30,0.98) 0%, rgba(6,10,20,1) 100%)",
      }}
    >
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
        {/* ✈ School Finals — Top Priority */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-extrabold tracking-widest text-amber-400/80 uppercase">
              School Final Prep
            </span>
          </div>
          <nav className="space-y-1">
            {finalsNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const isGold = item.accent === "gold";
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${
                    isActive
                      ? isGold
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/30"
                      : isGold
                      ? "text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent"
                      : "text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? isGold
                          ? "text-amber-400"
                          : "text-indigo-400"
                        : isGold
                        ? "text-amber-500/60"
                        : "text-indigo-500/60"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mx-2" />

        {/* Main Navigation */}
        <div>
          <span className="px-3 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase block mb-2">
            Learning Hub
          </span>
          <nav className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.name}
                item={item}
                activeClass="bg-gradient-to-r from-sky-500/15 to-indigo-500/10 text-sky-300 border border-sky-500/25"
                inactiveClass="text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                iconActive="text-sky-400"
              />
            ))}
          </nav>
        </div>

        {/* Management Section */}
        {isManagerOrAdmin && (
          <div>
            <div className="h-px bg-white/[0.04] mx-2 mb-4" />
            <span className="px-3 text-[10px] font-extrabold tracking-widest text-emerald-500/70 uppercase block mb-2">
              Management
            </span>
            <nav className="space-y-0.5">
              {moderationNav.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  activeClass="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  inactiveClass="text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                  iconActive="text-emerald-400"
                />
              ))}
            </nav>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <div className="h-px bg-white/[0.04] mx-2 mb-4" />
            <span className="px-3 text-[10px] font-extrabold tracking-widest text-amber-500/70 uppercase block mb-2">
              Administration
            </span>
            <nav className="space-y-0.5">
              {adminNav.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  activeClass="bg-amber-500/15 text-amber-300 border border-amber-500/25"
                  inactiveClass="text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                  iconActive="text-amber-400"
                />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Aircraft Badge Footer */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Aircraft Focus
          </div>
          <div className="text-xs font-bold text-sky-400 mt-0.5">
            {user.aircraft_studied && user.aircraft_studied.length > 0
              ? user.aircraft_studied.join(", ")
              : "Q400 / A320"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {user.airline || "Aviation Platform"}
          </div>
        </div>
      </div>
    </aside>
  );
}
