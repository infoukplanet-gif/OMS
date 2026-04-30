"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "日付を選択", className, compact }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value);

  const handleSelect = (d: Date | undefined) => {
    setDate(d);
    onChange?.(d);
  };

  const formatShort = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return compact ? `${y}/${m}/${day}` : `${y}年${m}月${day}日`;
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "h-9 px-3 rounded-xl text-sm flex items-center gap-2",
          "bg-white/50 backdrop-blur-xl border border-white/50",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          "hover:bg-white/70 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          !date && "text-gray-400",
          compact ? "w-auto min-w-[140px]" : "w-full",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="truncate">{date ? formatShort(date) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto p-0 border-white/60",
          "bg-white/80 backdrop-blur-2xl",
          "shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
        )}
        align="start"
      >
        <Calendar mode="single" selected={date} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}
