"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  dateAutoSettingsStore,
  INITIAL_DATE_AUTO_SETTINGS,
  type DateAutoRule,
  type DateAutoGlobal,
} from "@/lib/stores/date-auto-settings-store";

const fieldOptions = ["発送予定日", "入金期限", "支払期日（卸先）", "返品期限", "保証終了日", "再入金催促日", "フォロー送信日", "レビュー依頼日"];
const triggerOptions = ["受注確定", "売上計上", "出荷完了", "入金確認", "入金未確認", "発注確定"];
const basisOptions = ["受注日", "売上日", "発送日", "入金日", "発注日", "入金期限"];

const carryWeekendOptions: { value: DateAutoGlobal["defaultCarryWeekend"]; label: string }[] = [
  { value: "next", label: "翌営業日に繰越" },
  { value: "previous", label: "前営業日に繰上げ" },
  { value: "no", label: "そのまま" },
];

function cloneRules(rules: DateAutoRule[]): DateAutoRule[] {
  return rules.map((r) => ({ ...r }));
}

export default function SettingsDateAutoPage() {
  const toast = useToast();

  // 永続化オーナー
  usePersistentStore({
    store: dateAutoSettingsStore,
    domain: "date-auto-settings",
    seed: INITIAL_DATE_AUTO_SETTINGS,
  });

  const items = useSyncExternalStore(
    dateAutoSettingsStore.subscribe,
    dateAutoSettingsStore.getState,
    dateAutoSettingsStore.getState,
  );
  const config = items[0] ?? INITIAL_DATE_AUTO_SETTINGS[0];

  // ドラフト状態（フォーム編集用）。初期値は保存済み config から。
  const [rules, setRules] = useState<DateAutoRule[]>(config.rules);
  const [global, setGlobal] = useState<DateAutoGlobal>(config.global);

  // ストアが復元されたらドラフトを同期
  useEffect(() => {
    setRules(config.rules);
    setGlobal(config.global);
  }, [config]);

  const update = (id: string, patch: Partial<DateAutoRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = () => {
    dateAutoSettingsStore.upsert({ id: "config", rules: cloneRules(rules), global: { ...global } });
    toast.show("日付自動登録設定を保存しました", "success");
  };

  const reset = () => {
    const defaults = INITIAL_DATE_AUTO_SETTINGS[0];
    dateAutoSettingsStore.upsert({ id: "config", rules: cloneRules(defaults.rules), global: { ...defaults.global } });
    setRules(cloneRules(defaults.rules));
    setGlobal({ ...defaults.global });
    toast.show("初期値に戻しました", "info");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">日付自動登録設定</h1>
            <HelpHint>受注・出荷・入金・返品などの日付フィールドを基準日と差分から自動計算するルールを設定します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">営業日換算・休業日スキップ・週末繰越のロジックも個別設定できます。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={reset}>初期値に戻す</SecondaryButton>
          <PrimaryButton onClick={save}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録ルール</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{rules.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{rules.filter((r) => r.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">休業日スキップ</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{rules.filter((r) => r.skipHolidays).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">基準カレンダー</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">日本</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          グローバル設定 <HelpHint>個別ルールが指定しない場合のデフォルト動作。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">デフォルト単位</span>
            <select value={global.defaultUnit} onChange={(e) => setGlobal((g) => ({ ...g, defaultUnit: e.target.value as DateAutoGlobal["defaultUnit"] }))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option value="営業日">営業日</option>
              <option value="日">暦日</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">休業日カレンダー</span>
            <select value={global.holidayCalendar} onChange={(e) => setGlobal((g) => ({ ...g, holidayCalendar: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option value="japan">日本（祝日含む）</option>
              <option value="japan-no-holiday">日本（土日のみ）</option>
              <option value="custom">カスタム（店舗別）</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">週末繰越のデフォルト</span>
            <select value={global.defaultCarryWeekend} onChange={(e) => setGlobal((g) => ({ ...g, defaultCarryWeekend: e.target.value as DateAutoGlobal["defaultCarryWeekend"] }))} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {carryWeekendOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />日付計算ルール
          </h2>
          <SecondaryButton onClick={() => {
            const newId = `r${Date.now()}`;
            setRules((prev) => [...prev, { id: newId, field: "発送予定日", trigger: "受注確定", basis: "受注日", offsetDays: 1, offsetUnit: "営業日", skipHolidays: false, carryWeekend: "no", enabled: true }]);
          }}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />ルール追加</span>
          </SecondaryButton>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">対象フィールド</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">基準日</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">差分</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">単位</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">休業日除外</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">週末繰越</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", !r.enabled && "opacity-60")}>
                <td className="px-3 py-2.5">
                  <select value={r.field} onChange={(e) => update(r.id, { field: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {fieldOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <select value={r.trigger} onChange={(e) => update(r.id, { trigger: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {triggerOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <select value={r.basis} onChange={(e) => update(r.id, { basis: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {basisOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input type="number" value={r.offsetDays} onChange={(e) => update(r.id, { offsetDays: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs text-right" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={r.offsetUnit} onChange={(e) => update(r.id, { offsetUnit: e.target.value as DateAutoRule["offsetUnit"] })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    <option value="営業日">営業日</option>
                    <option value="日">暦日</option>
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={r.skipHolidays} onChange={(e) => update(r.id, { skipHolidays: e.target.checked })} className="accent-blue-500" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={r.carryWeekend} onChange={(e) => update(r.id, { carryWeekend: e.target.value as DateAutoRule["carryWeekend"] })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    <option value="next">翌営業日</option>
                    <option value="previous">前営業日</option>
                    <option value="no">そのまま</option>
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => { setRules((p) => p.filter((x) => x.id !== r.id)); toast.show("ルールを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
