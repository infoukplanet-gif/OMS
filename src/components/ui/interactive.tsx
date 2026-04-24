"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

// ---------- Toast ----------

type Toast = { id: number; message: string; kind: "success" | "error" | "info" };

type ToastCtx = {
  show: (message: string, kind?: Toast["kind"]) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl border flex items-center gap-2 min-w-[220px] pointer-events-auto",
              "bg-gray-900/85 text-white border-white/20"
            )}
          >
            {t.kind === "success" && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
            {t.kind === "error" && <X className="h-4 w-4 text-red-400 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: no provider → use console + alert
    return {
      show: (message: string) => {
        if (typeof window !== "undefined") console.log("[toast]", message);
      },
    };
  }
  return ctx;
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden",
          widthClass
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/40 bg-white/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Dropdown ----------

export function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-48",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle })}
      {open && (
        <div
          className={cn(
            "absolute mt-2 rounded-xl bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden z-30",
            width,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  selected = false,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
        "hover:bg-white/60",
        selected && "bg-blue-500/10",
        danger ? "text-red-600" : "text-gray-800"
      )}
    >
      {children}
    </button>
  );
}

// ---------- Primary/Secondary button helpers ----------

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
