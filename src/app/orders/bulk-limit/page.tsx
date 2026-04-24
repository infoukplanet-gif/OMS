"use client";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";

type Settings = {
  enabled: boolean;
  maxPerDay: number;
  maxPerSession: number;
  intervalSec: number;
  stopOnError: boolean;
  notifyOnLimit: boolean;
  autoPause: boolean;
  adminOnly: boolean;
};

const defaults: Settings = {
  enabled: true,
  maxPerDay: 500,
  maxPerSession: 100,
  intervalSec: 2,
  stopOnError: true,
  notifyOnLimit: true,
  autoPause: false,
  adminOnly: false,
};

export default function BulkLimitPage() {
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

  function upd<K extends keyof Settings>(k: K, v: Settings[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }

  function save() {
    if (draft.maxPerDay < 1) return toast.show("1日の上限件数は1以上で入力してください", "error");
    if (draft.maxPerSession < 1) return toast.show("1セッションの上限件数は1以上で入力してください", "error");
    if (draft.intervalSec < 0) return toast.show("処理間隔は0以上で入力してください", "error");
    setSaved(draft);
    toast.show("一括登録制限を保存しました");
  }
  function reset() {
    setDraft(saved);
    toast.show("変更を取消しました", "info");
  }

  const toggles: { key: keyof Settings; label: string; desc: string }[] = [
    { key: "enabled", label: "一括登録制限を有効化", desc: "オフにすると全ての制限が無効になります" },
    { key: "stopOnError", label: "エラー発生時に処理を中断", desc: "1件でも失敗したら以降の処理を止めます" },
    { key: "notifyOnLimit", label: "上限到達時に通知", desc: "上限に達したら管理者へメール通知します" },
    { key: "autoPause", label: "超過時に自動で一時停止", desc: "制限超過時に新規登録を自動停止します" },
    { key: "adminOnly", label: "管理者のみ実行可", desc: "一括登録機能を管理者権限のみに制限します" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">一括登録制限設定</h1>
        <div className="flex gap-2">
          <SecondaryButton onClick={reset}>取消</SecondaryButton>
          <PrimaryButton onClick={save} disabled={!dirty}>保存</PrimaryButton>
        </div>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">しきい値</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">1日の上限件数</label>
            <input type="number" min={1} value={draft.maxPerDay} onChange={(e) => upd("maxPerDay", Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">1セッションの上限件数</label>
            <input type="number" min={1} value={draft.maxPerSession} onChange={(e) => upd("maxPerSession", Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">処理間隔（秒）</label>
            <input type="number" min={0} step={0.5} value={draft.intervalSec} onChange={(e) => upd("intervalSec", Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums" />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">動作設定</h2>
        <div className="space-y-2">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft[t.key] as boolean}
                  onChange={(e) => upd(t.key, e.target.checked as Settings[typeof t.key])}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
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
