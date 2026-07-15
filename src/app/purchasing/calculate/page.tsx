"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Calculator, Play, Download, Info, AlertCircle, ArrowRight } from "lucide-react";
import { inventoryStore } from "@/lib/stores/inventory";
import { purchaseStore } from "@/lib/stores/purchase";
import { orderStore, type OrderRecord } from "@/lib/stores/orders";
import {
  INITIAL_INVENTORY,
  SKU_NAMES,
  SKU_SUPPLIER,
  SKU_UNIT_COST,
} from "@/lib/seeds/inventory";
import { INITIAL_PURCHASE_ORDERS } from "@/lib/seeds/purchase-orders";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import {
  freeStock,
  inventoryHealth,
  type InventoryRecord,
} from "@/lib/state-machines/inventory";
import { recommendReorderQty } from "@/lib/calculations/reorder-calculation";
import { computeShortageDemand } from "@/lib/calculations/shortage-demand";
import { buildPurchaseOrdersFromReorder, nextPoSeq } from "@/lib/calculations/reorder-to-po";
import { downloadCsv } from "@/lib/export/csv";

const fmt = (n: number) => `¥${n.toLocaleString()}`;
const rowKey = (sku: string, warehouse: string) => `${sku}@@${warehouse}`;

export default function CalculatePage() {
  const toast = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  // shared store seeding（発注計算から先に入った場合も初期データを満たす）。
  // 欠品実数（両方併用）の算定に受注も必要なため orderStore も seed。
  useEffect(() => {
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
    if (purchaseStore.getState().length === 0) {
      purchaseStore.setItems(INITIAL_PURCHASE_ORDERS);
    }
    if (orderStore.getState().length === 0) {
      orderStore.setItems(INITIAL_ORDERS);
    }
  }, []);

  const inventory = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => INITIAL_INVENTORY as readonly InventoryRecord[],
  );
  const purchaseOrders = useSyncExternalStore(
    (cb) => purchaseStore.subscribe(cb),
    () => purchaseStore.getState(),
    () => INITIAL_PURCHASE_ORDERS,
  );
  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS,
  ) as ReadonlyArray<OrderRecord>;

  // 引当待ちに残った欠品受注から SKU×倉庫別の不足実数を算定（両方併用の「欠品実数」側）。
  const shortageBySku = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of computeShortageDemand(orders, inventory)) {
      map.set(rowKey(line.sku, line.warehouse), line.shortQty);
    }
    return map;
  }, [orders, inventory]);

  // 未入荷の発注残（発行済・注残あり・未発行）を SKU ごとに集計（情報表示用）。
  const pendingBySku = useMemo(() => {
    const map = new Map<string, number>();
    for (const po of purchaseOrders) {
      if (po.status === "仕入完了" || po.status === "キャンセル" || po.status === "条件未達成") {
        continue;
      }
      const lines = po.lines as { sku: string; orderedQty: number; receivedQty: number }[];
      for (const l of lines) {
        const remaining = Math.max(0, l.orderedQty - l.receivedQty);
        if (remaining > 0) map.set(l.sku, (map.get(l.sku) ?? 0) + remaining);
      }
    }
    return map;
  }, [purchaseOrders]);

  // 在庫レコードから発注計算行を導出（推奨数は reorder エンジンが算定）。
  const rows = useMemo(
    () =>
      inventory.map((rec) => {
        const free = freeStock(rec);
        // 両方併用: 推奨発注数 = max(発注点補充数, 欠品実数)。
        const reorderQty = recommendReorderQty(rec);
        const shortQty = shortageBySku.get(rowKey(rec.sku, rec.warehouse)) ?? 0;
        return {
          ...rec,
          free,
          shortfall: Math.max(0, rec.constant - free),
          pending: pendingBySku.get(rec.sku) ?? 0,
          shortQty,
          suggestedQty: Math.max(reorderQty, shortQty),
          health: inventoryHealth(rec),
          name: SKU_NAMES[rec.sku] ?? rec.sku,
          supplier: SKU_SUPPLIER[rec.sku] ?? "仕入先未設定",
        };
      }),
    [inventory, pendingBySku, shortageBySku],
  );

  const reorderRows = useMemo(() => rows.filter((r) => r.suggestedQty > 0), [rows]);
  const allKeys = useMemo(() => reorderRows.map((r) => rowKey(r.sku, r.warehouse)), [reorderRows]);

  // null = 全選択。明示的に編集された時のみ Set を保持し、render で有効キーに絞る。
  const [explicitSel, setExplicitSel] = useState<Set<string> | null>(null);
  const selected = useMemo(() => {
    if (explicitSel === null) return new Set(allKeys);
    return new Set(allKeys.filter((k) => explicitSel.has(k)));
  }, [explicitSel, allKeys]);

  const toggle = (key: string) => {
    setExplicitSel((prev) => {
      const next = new Set(prev ?? allKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const allSelected = allKeys.length > 0 && selected.size === allKeys.length;
  const toggleAll = () => setExplicitSel(allSelected ? new Set() : null);

  const selectedRows = reorderRows.filter((r) => selected.has(rowKey(r.sku, r.warehouse)));
  const estimatedAmount = selectedRows.reduce(
    (sum, r) => sum + r.suggestedQty * (SKU_UNIT_COST[r.sku] ?? 0),
    0,
  );
  const totalQty = selectedRows.reduce((sum, r) => sum + r.suggestedQty, 0);
  const outOfStock = rows.filter((r) => r.health === "在庫切れ").length;

  /** 選択中の計算結果を発注書CSVとして書き出す。 */
  const exportCsv = () => {
    if (selectedRows.length === 0) return;
    downloadCsv(
      "発注書.csv",
      ["SKU", "商品名", "倉庫", "仕入先", "フリー在庫", "引当数", "在庫定数", "発注点", "発注残", "ロット", "推奨発注数", "単価", "金額"],
      selectedRows.map((r) => {
        const unitCost = SKU_UNIT_COST[r.sku] ?? 0;
        return [
          r.sku, r.name, r.warehouse, r.supplier,
          r.free, r.allocated, r.constant, r.reorder,
          r.pending, r.lot, r.suggestedQty, unitCost, r.suggestedQty * unitCost,
        ];
      }),
    );
    toast.show(`${selectedRows.length} 件の発注書CSVを書き出しました`, "success");
  };

  /** 選択行から仕入先ごとの未発行POを起票し、既存の未発行POを差し替える。 */
  const createPurchaseOrders = () => {
    if (selectedRows.length === 0) return;
    const suggestions = selectedRows.map((r) => ({
      sku: r.sku,
      warehouse: r.warehouse,
      currentFree: r.free,
      suggestedQty: r.suggestedQty,
    }));
    const existing = purchaseStore.getState();
    const today = new Date().toISOString().slice(0, 10);
    const newPOs = buildPurchaseOrdersFromReorder(
      suggestions,
      { supplier: SKU_SUPPLIER, unitCost: SKU_UNIT_COST },
      { today, year: new Date().getFullYear(), startSeq: nextPoSeq(existing.map((p) => p.id)) },
    );
    // 既存の「未発行」発注書は破棄し、計算結果で起票し直す（発注計算の仕様）。
    const retained = existing.filter((po) => po.status !== "未発行");
    purchaseStore.setItems([...(newPOs as unknown as typeof retained), ...retained]);
    setShowConfirm(false);
    toast.show(`${newPOs.length}件の発注書を起票しました（${totalQty}点 / ${fmt(estimatedAmount)}）`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">発注計算</h1>
            <HelpHint>
              発注点（フリー在庫が割り込んだら対象）と在庫定数（適正在庫）から、
              ロット単位で補充する推奨発注数を自動算定します。選択した商品を仕入先ごとに
              まとめて「未発行」の発注書として起票します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            在庫データから発注対象を抽出し、仕入先ごとの発注書を起票します。
          </p>
        </div>
        <Link
          href="/purchasing"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
        >
          発注一覧へ<ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-xs text-gray-500">発注対象SKU</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{reorderRows.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-gray-500">選択中の発注点数</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalQty}<span className="text-sm font-normal text-gray-400 ml-1">点</span></p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-gray-500">推定発注金額</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(estimatedAmount)}</p>
        </GlassCard>
        <GlassCard className={cn(outOfStock > 0 && "bg-red-500/5 border-red-500/20")}>
          <p className="text-xs text-gray-500">在庫切れSKU</p>
          <p className={cn("text-2xl font-bold mt-1", outOfStock > 0 ? "text-red-600" : "text-gray-800")}>
            {outOfStock}<span className="text-sm font-normal text-gray-400 ml-1">件</span>
          </p>
        </GlassCard>
      </div>

      {/* 計算式の説明 */}
      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-800 space-y-2">
            <p className="font-medium">計算式</p>
            <div className="p-3 rounded-xl bg-white/60 font-mono text-xs text-gray-800">
              推奨発注数 = ⌈（在庫定数 − フリー在庫）÷ 発注ロット⌉ × 発注ロット
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• <span className="font-medium text-blue-700">フリー在庫</span>: 在庫数 − 引当数（引当可能な残量）</li>
              <li>• <span className="font-medium text-blue-700">発注点</span>: フリー在庫がこの値以下になった商品が計算対象</li>
              <li>• <span className="font-medium text-blue-700">在庫定数</span>: 常に保持しておきたい適正在庫数（この水準まで補充）</li>
              <li>• <span className="font-medium text-blue-700">発注ロット</span>: 発注時の最小単位（計算結果はロット単位で繰り上げ）</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* 計算結果テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            計算結果プレビュー（{reorderRows.length}件中 {selectedRows.length}件選択中）
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              disabled={selectedRows.length === 0}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all",
                selectedRows.length > 0
                  ? "bg-white/60 border-white/50 text-gray-600 hover:bg-white/80"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              <Download className="h-3.5 w-3.5" />発注書ダウンロード
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={selectedRows.length === 0}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selectedRows.length > 0
                  ? "bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              <Calculator className="h-3.5 w-3.5" />発注書を作成（{selectedRows.length}件）
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-2 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">商品名</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">倉庫</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">仕入先</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">フリー在庫</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">引当数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">在庫定数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注点</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注残</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">ロット</th>
                <th className="px-2 py-2 text-center font-medium text-blue-700">
                  <span className="inline-flex items-center gap-1">
                    推奨発注数
                    <HelpHint side="left">発注点補充数と欠品受注の不足実数の大きい方（両方併用）。「欠品」バッジは欠品実数が反映された行です。</HelpHint>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reorderRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-400">
                    発注点を割り込んでいる商品はありません。
                  </td>
                </tr>
              ) : (
                reorderRows.map((r) => {
                  const key = rowKey(r.sku, r.warehouse);
                  const isSelected = selected.has(key);
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-t border-white/30 transition-colors",
                        isSelected ? "bg-blue-500/5" : "hover:bg-white/40",
                      )}
                    >
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(key)} className="rounded border-gray-300" />
                      </td>
                      <td className="px-2 py-2 font-mono text-gray-500">{r.sku}</td>
                      <td className="px-2 py-2 text-gray-800">{r.name}</td>
                      <td className="px-2 py-2 text-gray-600">{r.warehouse}</td>
                      <td className="px-2 py-2 text-gray-600">{r.supplier}</td>
                      <td className={cn("px-2 py-2 text-center font-medium", r.free <= 0 ? "text-red-600" : "text-gray-700")}>{r.free}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.allocated}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.constant}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.reorder}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.pending > 0 ? r.pending : "-"}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.lot}</td>
                      <td className="px-2 py-2 text-center">
                        <span className="font-bold text-blue-600 text-sm">{r.suggestedQty}</span>
                        {r.shortQty > 0 && (
                          <span
                            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-red-500/15 text-red-700 align-middle"
                            title={`欠品受注の不足実数 ${r.shortQty} 点を反映（両方併用）`}
                          >
                            欠品{r.shortQty}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 確認ダイアログ */}
      {showConfirm && (
        <GlassCard className="bg-yellow-500/5 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">発注書を起票しますか？</p>
              <p className="text-xs text-gray-700 mt-1">
                発注状態が「未発行」の発注伝票はすべて削除され、選択した {selectedRows.length} SKU が
                仕入先ごとの新しい発注伝票として起票されます（推定 {totalQty}点 / {fmt(estimatedAmount)}）。
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={createPurchaseOrders}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
                >
                  <Play className="h-4 w-4" />起票する
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
