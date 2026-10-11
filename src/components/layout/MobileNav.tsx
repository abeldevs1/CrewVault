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
  User as UserIcon,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/for-you", icon: Compass },
    { name: "Library", href: "/materials", icon: BookOpen },
    { name: "Groups", href: "/discussions", icon: Users },
    { name: "Upload", href: "/materials/upload", icon: Plus, special: true },
    { name: "Exams", href: "/exams", icon: GraduationCap },
    { name: "Profile", href: "/dashboard", icon: UserIcon },
  ];

  return (
    <nav className="mobile-bottom-nav lg:hidden">
      <div className="flex items-center justify-around px-2">
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-blue-400 mt-1">
                  {tab.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-3 min-w-[56px] transition-colors ${
                isActive ? "text-blue-400" : "text-slate-500"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-all ${
                  isActive ? "text-blue-400 scale-110" : "text-slate-500"
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  isActive ? "text-blue-400" : "text-slate-500"
                }`}
              >
                {tab.name}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
