"use client";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";

type ResetCycle = "never" | "daily" | "monthly" | "yearly";
type DateFormat = "none" | "yyyymmdd" | "yymmdd" | "yymm" | "yy";

type Settings = {
  prefix: string;
  dateFormat: DateFormat;
  digits: number;
  resetCycle: ResetCycle;
  startNumber: number;
  includeSeparator: boolean;
};

const defaults: Settings = {
  prefix: "ORD",
  dateFormat: "yyyymmdd",
  digits: 5,
  resetCycle: "daily",
  startNumber: 1,
  includeSeparator: true,
};

function generateNumber(s: Settings, base: Date, offset: number): string {
  const pad = (n: number, d: number) => String(n).padStart(d, "0");
  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  const d = base.getDate();
  let datePart = "";
  switch (s.dateFormat) {
    case "yyyymmdd": datePart = `${y}${pad(m, 2)}${pad(d, 2)}`; break;
    case "yymmdd":   datePart = `${String(y).slice(2)}${pad(m, 2)}${pad(d, 2)}`; break;
    case "yymm":     datePart = `${String(y).slice(2)}${pad(m, 2)}`; break;
    case "yy":       datePart = `${String(y).slice(2)}`; break;
    case "none":     datePart = ""; break;
  }
  const seq = pad(s.startNumber + offset, s.digits);
  const sep = s.includeSeparator ? "-" : "";
  const parts = [s.prefix, datePart, seq].filter(Boolean);
  return parts.join(sep);
}

export default function NumberingPage() {
  const toast = useToast();
  const [saved, setSaved] = useState<Settings>(defaults);
  const [draft, setDraft] = useState<Settings>(defaults);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const previews = useMemo(() => {
    const base = new Date();
    return [0, 1, 2].map((i) => generateNumber(draft, base, i));
  }, [draft]);

  function upd<K extends keyof Settings>(k: K, v: Settings[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }
  function save() {
    if (!draft.prefix.trim() && draft.dateFormat === "none") {
      return toast.show("プレフィックスか日付フォーマットのいずれかは必須です", "error");
    }
    if (draft.digits < 1 || draft.digits > 10) {
      return toast.show("桁数は1〜10で入力してください", "error");
    }
    if (draft.startNumber < 0) {
      return toast.show("開始番号は0以上で入力してください", "error");
    }
    setSaved(draft);
    toast.show("採番設定を保存しました");
  }
  function reset() {
    setDraft(saved);
    toast.show("変更を取消しました", "info");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">伝票受注番号</h1>
        <div className="flex gap-2">
          <SecondaryButton onClick={reset}>取消</SecondaryButton>
          <PrimaryButton onClick={save} disabled={!dirty}>保存</PrimaryButton>
        </div>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">プレフィックス</label>
            <input
              type="text"
              value={draft.prefix}
              onChange={(e) => upd("prefix", e.target.value)}
              placeholder="例: ORD"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">日付フォーマット</label>
            <select
              value={draft.dateFormat}
              onChange={(e) => upd("dateFormat", e.target.value as DateFormat)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="yyyymmdd">YYYYMMDD（2026-04-24）</option>
              <option value="yymmdd">YYMMDD（260424）</option>
              <option value="yymm">YYMM（2604）</option>
              <option value="yy">YY（26）</option>
              <option value="none">日付なし</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">連番桁数</label>
            <input
              type="number"
              min={1} max={10}
              value={draft.digits}
              onChange={(e) => upd("digits", Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">リセット周期</label>
            <select
              value={draft.resetCycle}
              onChange={(e) => upd("resetCycle", e.target.value as ResetCycle)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="never">リセットしない</option>
              <option value="daily">毎日</option>
              <option value="monthly">毎月</option>
              <option value="yearly">毎年</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">開始番号</label>
            <input
              type="number"
              min={0}
              value={draft.startNumber}
              onChange={(e) => upd("startNumber", Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.includeSeparator}
                onChange={(e) => upd("includeSeparator", e.target.checked)}
                className="rounded border-gray-300"
              />
              区切り文字（-）を使う
            </label>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">生成プレビュー（次の3件）</h2>
        <div className="space-y-2">
          {previews.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <span className="text-xs text-gray-500 tabular-nums">#{i + 1}</span>
              <code className="font-mono text-base font-medium text-blue-700">{p}</code>
            </div>
          ))}
        </div>
      </GlassCard>

      {dirty && (
        <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          未保存の変更があります
        </p>
      )}
    </div>
  );
}
