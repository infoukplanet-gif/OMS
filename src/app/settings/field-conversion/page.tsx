"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  fieldConversionStore,
  INITIAL_FIELD_MAPPINGS,
  type FieldMapping as Mapping,
} from "@/lib/stores/field-conversion-store";
import { downloadCsv } from "@/lib/export/csv";

const sources = ["楽天RMS", "Yahoo!", "Amazon SP-API", "au PAY マーケット", "Qoo10", "FAX手入力", "電話手入力", "CSVアップロード"];
const targets = ["OMS受注", "OMS明細", "OMS顧客", "OMS出荷", "OMS入金"];
const transforms: Mapping["transform"][] = ["そのまま", "全角→半角", "半角→全角", "前後トリム", "数値化", "日付フォーマット変換", "正規表現", "辞書変換"];

export default function FieldConversionPage() {
  const toast = useToast();

  // 永続化オーナー（このページのみ呼ぶ）
  usePersistentStore({
    store: fieldConversionStore,
    domain: "field-conversion-settings",
    seed: INITIAL_FIELD_MAPPINGS,
  });

  // 共有ストアを購読（編集は即ストアへ反映＝保存ボタンは確認用）
  const items = useSyncExternalStore(
    fieldConversionStore.subscribe,
    fieldConversionStore.getState,
    fieldConversionStore.getState,
  );

  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.sourceField} ${i.targetField}`.toLowerCase().includes(k)) return false;
      if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
      return true;
    });
  }, [items, keyword, sourceFilter]);

  const update = (id: string, patch: Partial<Mapping>) => {
    const current = fieldConversionStore.findById(id);
    if (!current) return;
    fieldConversionStore.upsert({ ...current, ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">項目変換設定</h1>
            <HelpHint>外部モール・取込データの項目をOMSの内部項目にマッピングします。文字種変換・日付正規化・辞書変換を指定できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天・Yahoo!・Amazon等のデータをOMSに正規化して取込みます。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => {
            downloadCsv(
              "項目変換設定.csv",
              ["取込元", "ソース項目", "取込先", "ターゲット項目", "変換ルール", "既定値", "必須", "有効"],
              items.map((i) => [i.source, i.sourceField, i.target, i.targetField, i.transform, i.defaultValue, i.required ? "必須" : "任意", i.enabled ? "有効" : "無効"]),
            );
            toast.show(`${items.length} 件のマッピング設定をエクスポートしました`, "success");
          }}>エクスポート</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("項目変換設定を保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録マッピング</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">必須項目</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((i) => i.required).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">変換適用</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => i.transform !== "そのまま").length}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="ソース・ターゲットフィールド名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">取込元: すべて</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setSourceFilter("all"); }}>クリア</SecondaryButton>
          <SecondaryButton onClick={() => {
            const newItem: Mapping = { id: `m-${Date.now()}`, source: "楽天RMS", sourceField: "", target: "OMS受注", targetField: "", transform: "そのまま", defaultValue: "—", required: false, enabled: true };
            fieldConversionStore.upsert(newItem);
          }}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />新規追加</span>
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">取込元</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ソース項目</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">→</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">取込先</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ターゲット項目</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">変換ルール</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">既定値</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">必須</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className={cn("border-t border-white/30 hover:bg-white/40", !i.enabled && "opacity-60")}>
                <td className="px-3 py-2.5">
                  <select value={i.source} onChange={(e) => update(i.id, { source: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input value={i.sourceField} onChange={(e) => update(i.id, { sourceField: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-mono w-40" />
                </td>
                <td className="px-3 py-2.5 text-center text-gray-400"><ArrowRight className="h-3.5 w-3.5 inline" /></td>
                <td className="px-3 py-2.5">
                  <select value={i.target} onChange={(e) => update(i.id, { target: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {targets.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input value={i.targetField} onChange={(e) => update(i.id, { targetField: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-mono w-40" />
                </td>
                <td className="px-3 py-2.5">
                  <select value={i.transform} onChange={(e) => update(i.id, { transform: e.target.value as Mapping["transform"] })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {transforms.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input value={i.defaultValue} onChange={(e) => update(i.id, { defaultValue: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs w-20" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input type="checkbox" checked={i.required} onChange={(e) => update(i.id, { required: e.target.checked })} className="accent-blue-500" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={i.enabled} onChange={(e) => update(i.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => { fieldConversionStore.remove(i.id); toast.show("マッピングを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
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
