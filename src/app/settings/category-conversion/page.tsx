"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRight, Edit, Plus, Search, Trash2 } from "lucide-react";

type Rule = {
  id: string;
  from: string;
  fromSource: string;
  to: string;
  matchType: "完全一致" | "前方一致" | "正規表現";
  priority: number;
  hits: number;
  enabled: boolean;
};

const initial: Rule[] = [
  { id: "c-1", from: "レディース > トップス > Tシャツ", fromSource: "楽天", to: "アパレル/トップス/Tシャツ", matchType: "完全一致", priority: 1, hits: 1245, enabled: true },
  { id: "c-2", from: "Women > Tops > Tee", fromSource: "Amazon", to: "アパレル/トップス/Tシャツ", matchType: "完全一致", priority: 1, hits: 580, enabled: true },
  { id: "c-3", from: "ファッション > シャツ", fromSource: "Yahoo!", to: "アパレル/トップス/シャツ", matchType: "完全一致", priority: 1, hits: 420, enabled: true },
  { id: "c-4", from: "家電 > 生活家電 > 掃除機", fromSource: "楽天", to: "家電/生活家電/掃除機", matchType: "完全一致", priority: 1, hits: 98, enabled: true },
  { id: "c-5", from: "雑貨 > キッチン > 食器", fromSource: "自社EC", to: "ライフ/キッチン/食器", matchType: "完全一致", priority: 1, hits: 312, enabled: true },
  { id: "c-6", from: "ファッション > レディース.*", fromSource: "Yahoo!", to: "アパレル/レディース", matchType: "正規表現", priority: 5, hits: 88, enabled: true },
  { id: "c-7", from: "メンズ > ", fromSource: "楽天", to: "アパレル/メンズ", matchType: "前方一致", priority: 5, hits: 244, enabled: true },
  { id: "c-8", from: "Beauty > Skincare", fromSource: "Amazon", to: "コスメ/スキンケア", matchType: "完全一致", priority: 1, hits: 156, enabled: true },
  { id: "c-9", from: "ホーム&キッチン", fromSource: "Amazon", to: "ライフ/キッチン", matchType: "前方一致", priority: 5, hits: 78, enabled: true },
  { id: "c-10", from: "未分類", fromSource: "FAX手入力", to: "その他", matchType: "完全一致", priority: 9, hits: 32, enabled: false },
];

const sources = ["楽天", "Yahoo!", "Amazon", "au PAY マーケット", "Qoo10", "自社EC", "FAX手入力"];
const targets = ["アパレル/トップス/Tシャツ", "アパレル/トップス/シャツ", "アパレル/レディース", "アパレル/メンズ", "家電/生活家電/掃除機", "ライフ/キッチン", "ライフ/キッチン/食器", "コスメ/スキンケア", "その他"];

export default function CategoryConversionPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items
      .filter((r) => {
        if (k && !`${r.from} ${r.to}`.toLowerCase().includes(k)) return false;
        if (sourceFilter !== "all" && r.fromSource !== sourceFilter) return false;
        if (matchFilter !== "all" && r.matchType !== matchFilter) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority || b.hits - a.hits);
  }, [items, keyword, sourceFilter, matchFilter]);

  const update = (id: string, patch: Partial<Rule>) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">カテゴリ変換設定</h1>
            <HelpHint>モールごとのカテゴリ表記をOMS標準カテゴリに正規化します。完全一致・前方一致・正規表現で柔軟にマッチング可能。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天・Yahoo!・Amazonのカテゴリツリーを自社標準にマッピングし、商品取込時に自動変換します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("変換ルールをCSVで書き出しました", "success")}>CSV書き出し</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("新規ルールを追加します", "info")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />新規ルール</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録ルール</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">取込元数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{new Set(items.map((i) => i.fromSource)).size}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間ヒット数</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.reduce((s, i) => s + i.hits, 0).toLocaleString()}</div>
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
              placeholder="変換元・変換先カテゴリ"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">取得元: すべて</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">一致: すべて</option>
            <option value="完全一致">完全一致</option>
            <option value="前方一致">前方一致</option>
            <option value="正規表現">正規表現</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setSourceFilter("all"); setMatchFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">変換元カテゴリ</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">取得元</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">一致方法</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">→</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">変換先カテゴリ</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">月間ヒット</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={cn("border-t border-white/30 hover:bg-white/40", !r.enabled && "opacity-60")}>
                <td className="px-3 py-2.5 text-center">
                  <input type="number" value={r.priority} onChange={(e) => update(r.id, { priority: Number(e.target.value) })} className="w-12 px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs text-center" />
                </td>
                <td className="px-3 py-2.5">
                  <input value={r.from} onChange={(e) => update(r.id, { from: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-mono w-72" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={r.fromSource} onChange={(e) => update(r.id, { fromSource: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={r.matchType} onChange={(e) => update(r.id, { matchType: e.target.value as Rule["matchType"] })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    <option value="完全一致">完全一致</option>
                    <option value="前方一致">前方一致</option>
                    <option value="正規表現">正規表現</option>
                  </select>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-400"><ArrowRight className="h-3.5 w-3.5 inline" /></td>
                <td className="px-3 py-2.5">
                  <select value={r.to} onChange={(e) => update(r.id, { to: e.target.value })} className="px-2 py-1 rounded-lg bg-white/70 border border-white/60 text-xs">
                    {targets.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{r.hits.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => toast.show(`${r.from} を編集します`, "info")} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="編集">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setItems((p) => p.filter((x) => x.id !== r.id)); toast.show("ルールを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25" title="削除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
