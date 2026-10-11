"use client";

import React from "react";
import { Plane } from "lucide-react";

interface PlaneLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  variant?: "bounce" | "fly" | "pulse";
}

export default function PlaneLoader({
  text = "Loading...",
  size = "md",
  variant = "bounce",
}: PlaneLoaderProps) {
  const sizeMap = {
    sm: { icon: "w-5 h-5", text: "text-xs", runway: "w-20", gap: "gap-2" },
    md: { icon: "w-8 h-8", text: "text-sm", runway: "w-32", gap: "gap-3" },
    lg: { icon: "w-12 h-12", text: "text-base", runway: "w-48", gap: "gap-4" },
  };

  const s = sizeMap[size];

  const animClass =
    variant === "fly"
      ? "plane-fly-loader"
      : variant === "pulse"
      ? "plane-pulse-loader"
      : "plane-loader";

  return (
    <div className={`flex flex-col items-center justify-center ${s.gap} py-8`}>
      <div className="relative">
        <Plane
          className={`${s.icon} text-blue-400 ${animClass}`}
          strokeWidth={1.5}
        />
        {/* Contrail effect */}
        <div className="absolute top-1/2 right-full -translate-y-1/2 w-8 h-[1px] bg-gradient-to-l from-blue-400/30 to-transparent" />
      </div>

      {/* Runway progress bar */}
      <div className={`${s.runway} runway-loader`} />

      <p className={`${s.text} font-medium text-slate-400 tracking-wide`}>
        {text}
      </p>
    </div>
  );
}
