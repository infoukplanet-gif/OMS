"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-14 flex items-center justify-between px-6",
        "bg-white/60 backdrop-blur-2xl",
        "border-b border-white/50",
        "shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
      )}
    >
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="注文・商品・顧客を検索...  ⌘K"
          className={cn(
            "w-full h-9 pl-10 pr-4 rounded-xl text-sm",
            "bg-white/70 backdrop-blur-xl",
            "border border-white/60",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30",
            "transition-all duration-200"
          )}
          readOnly
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          className={cn(
            "relative p-2 rounded-xl",
            "bg-white/60 backdrop-blur-xl",
            "border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            "hover:bg-white/80 transition-all duration-200"
          )}
        >
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] font-medium text-white flex items-center justify-center">
            3
          </span>
        </button>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl",
            "bg-white/60 backdrop-blur-xl",
            "border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-600 text-xs font-bold">
            大
          </div>
          <span className="text-sm text-gray-700">大野 勇樹</span>
        </div>
      </div>
    </header>
  );
}
