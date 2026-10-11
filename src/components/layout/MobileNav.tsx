"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Plus,
  GraduationCap,
  Users,
  Brain,
  User as UserIcon,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/for-you", icon: Compass },
    { name: "Recall", href: "/recall", icon: Brain },
    { name: "Library", href: "/materials", icon: BookOpen },
    { name: "Upload", href: "/materials/upload", icon: Plus, special: true },
    { name: "Exams", href: "/exams", icon: GraduationCap },
    { name: "Groups", href: "/discussions", icon: Users },
    { name: "Profile", href: "/dashboard", icon: UserIcon },
  ];

  return (
    <nav className="mobile-bottom-nav lg:hidden z-50">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));

          if (tab.special) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex flex-col items-center -mt-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-semibold text-blue-400 mt-0.5">
                  {tab.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center py-1 px-1.5 transition-colors ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.75} />
              <span
                className={`text-[9px] mt-0.5 ${
                  isActive ? "font-bold text-blue-400" : "font-medium text-slate-400"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
