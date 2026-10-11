import React from "react";
import { UserRole } from "@/types";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const isSm = size === "sm";

  if (role === "ADMIN") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${
          isSm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        }`}
      >
        <ShieldAlert className={isSm ? "w-3 h-3 text-amber-400" : "w-4 h-4 text-amber-400"} />
        ADMIN
      </span>
    );
  }

  if (role === "MANAGER") {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${
          isSm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        }`}
      >
        <ShieldCheck className={isSm ? "w-3 h-3 text-emerald-400" : "w-4 h-4 text-emerald-400"} />
        MANAGER
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${
        isSm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <Shield className={isSm ? "w-3 h-3 text-sky-400" : "w-4 h-4 text-sky-400"} />
      MEMBER
    </span>
  );
}
