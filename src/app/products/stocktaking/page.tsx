"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Play, CheckCircle2, Search, History, ScanLine, Save } from "lucide-react";
import { inventoryStore } from "@/lib/stores/inventory";
import { INITIAL_INVENTORY, SKU_NAMES } from "@/lib/seeds/inventory";
import type { InventoryRecord } from "@/lib/state-machines/inventory";

/** SKU ごとのロケーション補完（在庫レコードにロケ情報がないため UI 層で補う）。 */
const SKU_LOCATION: Record<string, string> = {
  "WEP-001-BK": "A1-001", "WEP-001-WH": "A1-002", "UCB-002": "A2-008",
  "MBT-004": "B3-014", "CHG-007": "B3-018", "PFS-005": "C1-005",
  "TWS-006-BK": "A1-005", "TS-WH-M": "D1-002", "JK-NV-L": "D2-006",
};
const COUNTED_BY = "佐藤 健";

const keyOf = (sku: string, warehouse: string) => `${sku}@@${warehouse}`;

const PAST_STOCKTAKINGS = [
  { id: "STK-2026-0042", at: "2026-04-15", warehouse: "東京本社倉庫", scope: "A棚全体", items: 184, diff: 12, status: "完了" },
  { id: "STK-2026-0041", at: "2026-03-31", warehouse: "東京本社倉庫", scope: "全棚", items: 1284, diff: 48, status: "完了" },
  { id: "STK-2026-0040", at: "2026-03-15", warehouse: "大阪倉庫", scope: "全棚", items: 642, diff: 18, status: "完了" },
];

export default function StocktakingPage() {
  const toast = useToast();
  const [active, setActive] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);
  // 実棚入力（sku@warehouse → 実数）。未入力(null)は未カウント。
  const [actuals, setActuals] = useState<Record<string, number | null>>({});

  // 共有 inventoryStore を購読。システム在庫(onHand)は実データ由来。
  useEffect(() => {
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);
  const inventory = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => INITIAL_INVENTORY as readonly InventoryRecord[],
  );

  // 在庫レコード → 棚卸行（system=onHand、実棚は actuals state から補完）。
  const items = useMemo(
    () =>
      inventory.map((r) => {
        const key = keyOf(r.sku, r.warehouse);
        const actual = actuals[key] ?? null;
        return {
          key,
          sku: r.sku,
          warehouse: r.warehouse,
          name: SKU_NAMES[r.sku] ?? r.sku,
          location: SKU_LOCATION[r.sku] ?? "—",
          system: r.onHand,
          actual,
          by: actual !== null ? COUNTED_BY : null,
        };
      }),
    [inventory, actuals],
  );

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return items.filter((i) => {
      if (k && !i.sku.toLowerCase().includes(k) && !i.name.toLowerCase().includes(k) && !i.location.toLowerCase().includes(k)) return false;
      if (diffOnly && (i.actual === null || i.actual === i.system)) return false;
      return true;
    });
  }, [items, keyword, diffOnly]);

  const updateActual = (key: string, value: string) => {
    const num = value === "" ? null : Number(value);
    setActuals((prev) => ({ ...prev, [key]: num }));
  };

  const stats = {
    total: items.length,
    counted: items.filter((i) => i.actual !== null).length,
    diff: items.filter((i) => i.actual !== null && i.actual !== i.system).length,
    diffQty: items.filter((i) => i.actual !== null).reduce((s, i) => s + Math.abs((i.actual ?? 0) - i.system), 0),
  };

  /** 差異を確定 → inventoryStore.applyAdjust で onHand を実棚に合わせる。 */
  const confirmDiff = () => {
    const adjustments = items
      .filter((i) => i.actual !== null && i.actual !== i.system)
      .map((i) => ({ sku: i.sku, warehouse: i.warehouse, delta: (i.actual as number) - i.system }));
    if (adjustments.length === 0) {
      toast.show("確定する差異がありません", "info");
      return;
    }
    const result = inventoryStore.applyAdjust(adjustments);
    const net = adjustments.reduce((s, a) => s + a.delta, 0);
    // 確定後は実棚入力をクリア（onHand が更新され差異が解消するため）。
    setActuals({});
    toast.show(
      `差異を確定: ${result.appliedCount}SKU の在庫を更新（純増減 ${net > 0 ? "+" : ""}${net}点）`,
      "success",
    );
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
              <PrimaryButton onClick={confirmDiff}>
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
                <tr key={i.key} className={cn("border-t border-white/30 hover:bg-white/40", diff !== null && diff !== 0 && "bg-amber-500/5")}>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{i.sku}</td>
                  <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.location}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 tabular-nums">{i.system}</td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      value={i.actual ?? ""}
                      onChange={(e) => updateActual(i.key, e.target.value)}
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
