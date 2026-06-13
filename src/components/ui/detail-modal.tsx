"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DetailRow = {
  label: string;
  value: string | number;
  mono?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
};

interface DetailModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: DetailRow[];
  onClose: () => void;
  footer?: React.ReactNode;
}

const TONE_CLASS: Record<NonNullable<DetailRow["tone"]>, string> = {
  default: "text-gray-800",
  success: "text-emerald-700 font-semibold",
  warning: "text-amber-700 font-semibold",
  danger: "text-rose-700 font-semibold",
};

/**
 * 一覧の各行の詳細を表示する汎用ガラスモーダル。
 * 取込履歴・処理ログなど「詳細」ボタンの実装に共用する。
 */
export function DetailModal({ open, title, subtitle, rows, onClose, footer }: DetailModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 grid place-items-center rounded-lg bg-white/50 border border-white/50 text-gray-500 hover:bg-white/70 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/50 border border-white/50"
            >
              <span className="text-xs text-gray-500 shrink-0">{r.label}</span>
              <span
                className={cn(
                  "text-right break-all text-sm",
                  TONE_CLASS[r.tone ?? "default"],
                  r.mono && "font-mono text-xs",
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
