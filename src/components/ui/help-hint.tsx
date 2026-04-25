"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { cn } from "@/lib/utils";

interface HelpHintProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  size?: "sm" | "md";
  label?: string;
}

export function HelpHint({
  children,
  className,
  side = "top",
  size = "sm",
  label = "ヘルプを表示",
}: HelpHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          size === "sm" ? "h-5 w-5" : "h-6 w-6",
          className
        )}
      >
        <HelpCircle className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-xs whitespace-pre-line leading-relaxed bg-gray-900/95 text-white"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
