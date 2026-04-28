"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Play, CheckCircle2, Search, History, ScanLine, Save } from "lucide-react";

type Item = {
  sku: string;
  name: string;
  location: string;
  system: number;
  actual: number | null;
  by: string | null;
};

const ITEMS_INIT: Item[] = [
  { sku: "WEP-001-BK", name: "ワイヤレスイヤホン Pro / ブラック", location: "A1-001", system: 30, actual: 30, by: "佐藤 健" },
  { sku: "WEP-001-WH", name: "ワイヤレスイヤホン Pro / ホワイト", location: "A1-002", system: 15, actual: 14, by: "佐藤 健" },
  { sku: "UCB-002", name: "USB-Cケーブル 2m", location: "A2-008", system: 8, actual: null, by: null },
  { sku: "MBT-004", name: "モバイルバッテリー 20000mAh", location: "B3-014", system: 2, actual: 2, by: "鈴木 美咲" },
  { sku: "CHG-007", name: "急速充電器 65W", location: "B3-018", system: 67, actual: 65, by: "鈴木 美咲" },
  { sku: "PFS-005", name: "保護フィルム セット", location: "C1-005", system: 120, actual: null, by: null },
  { sku: "TWS-006-BK", name: "完全ワイヤレスイヤホン / ブラック", location: "A1-005", system: 0, actual: null, by: null },
];

const PAST_STOCKTAKINGS = [
  { id: "STK-2026-0042", at: "2026-04-15", warehouse: "東京本社倉庫", scope: "A棚全体", items: 184, diff: 12, status: "完了" },
  { id: "STK-2026-0041", at: "2026-03-31", warehouse: "東京本社倉庫", scope: "全棚", items: 1284, diff: 48, status: "完了" },
  { id: "STK-2026-0040", at: "2026-03-15", warehouse: "大阪倉庫", scope: "全棚", items: 642, diff: 18, status: "完了" },
];

export default function StocktakingPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>(ITEMS_INIT);
  const [active, setActive] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return items.filter((i) => {
      if (k && !i.sku.toLowerCase().includes(k) && !i.name.toLowerCase().includes(k) && !i.location.toLowerCase().includes(k)) return false;
      if (diffOnly && (i.actual === null || i.actual === i.system)) return false;
      return true;
    });
  }, [items, keyword, diffOnly]);

  const updateActual = (sku: string, value: string) => {
    const num = value === "" ? null : Number(value);
    setItems(items.map((i) => (i.sku === sku ? { ...i, actual: num, by: num !== null ? "佐藤 健" : null } : i)));
  };

  const stats = {
    total: items.length,
    counted: items.filter((i) => i.actual !== null).length,
    diff: items.filter((i) => i.actual !== null && i.actual !== i.system).length,
    diffQty: items.filter((i) => i.actual !== null).reduce((s, i) => s + Math.abs((i.actual ?? 0) - i.system), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">棚卸</h1>
            <HelpHint>
              実在庫を数えて、システム在庫との差異を確定するワークフローです。{"\n"}
              バーコード入力、ロケ別分担、差異承認、過去棚卸の参照に対応しています。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            進捗: <span className="font-semibold">{stats.counted}/{stats.total}</span> ／ 差異検出:{" "}
            <span className="font-semibold text-amber-700">{stats.diff}</span> SKU
          </p>
        </div>
        <div className="flex gap-2">
          {active ? (
            <>
              <button
                onClick={() => toast.show("バーコードスキャンモードを開始しました")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
              >
                <ScanLine className="h-4 w-4" />スキャンモード
              </button>
              <PrimaryButton onClick={() => toast.show("差異を承認し、在庫数を更新しました", "success")}>
                <Save className="h-4 w-4" />差異を確定
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton onClick={() => setActive(true)}>
              <Play className="h-4 w-4" />棚卸開始
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象SKU</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.total}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">数え終わり</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.counted}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">差異あり</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.diff}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">差異数量合計</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.diffQty}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="SKU・商品名・ロケで検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            差異ありのみ表示
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ロケ</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">システム在庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">実数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">差異</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">数えた人</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const diff = i.actual !== null ? i.actual - i.system : null;
              return (
                <tr key={i.sku} className={cn("border-t border-white/30 hover:bg-white/40", diff !== null && diff !== 0 && "bg-amber-500/5")}>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{i.sku}</td>
                  <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.location}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 tabular-nums">{i.system}</td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      value={i.actual ?? ""}
                      onChange={(e) => updateActual(i.sku, e.target.value)}
                      className="h-7 w-20 px-2 rounded-lg text-xs text-center bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      placeholder="入力"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {diff === null ? (
                      <span className="text-gray-400">—</span>
                    ) : diff === 0 ? (
                      <CheckCircle2 className="inline-block h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <span className={cn("font-semibold", diff > 0 ? "text-emerald-600" : "text-red-600")}>
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{i.by ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">過去の棚卸履歴</h2>
          <HelpHint>過去に実施した棚卸の概要。差異が大きい場合は監査調査の対象になります。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">実施日</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">倉庫</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">範囲</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">対象SKU</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">差異数</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
              </tr>
            </thead>
            <tbody>
              {PAST_STOCKTAKINGS.map((p) => (
                <tr key={p.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{p.id}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums">{p.at}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{p.warehouse}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{p.scope}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{p.items}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={cn(p.diff > 30 ? "text-red-700 font-semibold" : "text-gray-700")}>{p.diff}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
