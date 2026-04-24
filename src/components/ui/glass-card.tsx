import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        "bg-white/70 backdrop-blur-3xl",
        "border border-white/60",
        "shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
