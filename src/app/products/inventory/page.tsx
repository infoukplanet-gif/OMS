"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  Search,
  Settings2,
  Package,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  Download,
  CheckCircle2,
  ArchiveX,
  ClipboardList,
} from "lucide-react";
import {
  type InventoryRecord,
  type InventoryHealth,
  freeStock,
  inventoryHealth,
} from "@/lib/state-machines/inventory";
import {
  reorderSuggestions,
  type ReorderSuggestion,
} from "@/lib/calculations/reorder-calculation";
import { type PurchaseOrderLine, type PurchaseOrderState } from "@/lib/state-machines/purchase";
import { inventoryStore } from "@/lib/stores/inventory";
import { INITIAL_INVENTORY, SKU_NAMES } from "@/lib/seeds/inventory";

// -----------------------------------------------------------------------
// デザイントークン
// -----------------------------------------------------------------------
const STATUS_BADGE: Record<InventoryHealth, string> = {
  適正:     "bg-emerald-500/15 text-emerald-700",
  発注対象: "bg-yellow-500/15 text-yellow-700",
  在庫切れ: "bg-red-500/15 text-red-700",
  過剰:     "bg-purple-500/15 text-purple-700",
};

// -----------------------------------------------------------------------
// ページコンポーネント
// -----------------------------------------------------------------------
export default function InventoryPage() {
  const toast = useToast();

  // shared inventoryStore に subscribe して画面横断の在庫変更を読む。
  // 発注ページからの入荷登録（applyReceive cascade）が onHand に反映されるとここに即時反映される。
  useEffect(() => {
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
  }, []);
  const records = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => INITIAL_INVENTORY as readonly InventoryRecord[],
  );

  // フィルタ状態
  const [keyword, setKeyword]             = useState("");
  const [statusFilter, setStatusFilter]   = useState("すべて");
  const [warehouseFilter, setWarehouseFilter] = useState("すべて");

  // 発注推奨セクション：選択行管理
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  // -----------------------------------------------------------------------
  // 派生データ（inventoryHealth / freeStock を正規関数から導出）
  // -----------------------------------------------------------------------
  const enriched = useMemo(
    () =>
      records.map((r) => ({
        record: r,
        name:   SKU_NAMES[r.sku] ?? r.sku,
        health: inventoryHealth(r),
        free:   freeStock(r),
      })),
    [records],
  );

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return enriched.filter(({ record, name, health }) => {
      if (k && !record.sku.toLowerCase().includes(k) && !name.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && health !== statusFilter) return false;
      if (warehouseFilter !== "すべて" && record.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [enriched, keyword, statusFilter, warehouseFilter]);

  // KPI: inventoryHealth で集計
  const stats = useMemo(() => {
    const healths = enriched.map((e) => e.health);
    return {
      total:      records.length,
      proper:     healths.filter((h) => h === "適正").length,
      needOrder:  healths.filter((h) => h === "発注対象").length,
      outOfStock: healths.filter((h) => h === "在庫切れ").length,
      overStock:  healths.filter((h) => h === "過剰").length,
    };
  }, [enriched, records.length]);

  // 発注推奨一覧（reorderSuggestions を実利用、最新ストア値を反映）
  const suggestions: ReorderSuggestion[] = useMemo(
    () => reorderSuggestions([...records]),
    [records],
  );

  // -----------------------------------------------------------------------
  // イベントハンドラ
  // -----------------------------------------------------------------------
  function toggleSku(sku: string) {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }

  function toggleAllSuggestions() {
    if (selectedSkus.size === suggestions.length) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(suggestions.map((s) => s.sku)));
    }
  }

  function handleCreatePurchaseOrder() {
    const targets = suggestions.filter((s) => selectedSkus.has(s.sku));
    if (targets.length === 0) {
      toast.show("発注推奨行を1件以上選択してください");
      return;
    }

    const lines: PurchaseOrderLine[] = targets.map((s) => ({
      sku:         s.sku,
      warehouse:   s.warehouse,
      orderedQty:  s.suggestedQty,
      receivedQty: 0,
    }));

    // モック生成（実装フェーズでは API 呼び出しに差し替え）
    const draft: PurchaseOrderState = { status: "未発行", lines };
    console.info("[InventoryPage] 発注書ドラフト生成:", draft);

    toast.show(`発注書を作成しました（${lines.length} SKU）`);
    setSelectedSkus(new Set());
  }

  // -----------------------------------------------------------------------
  // レンダリング
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">在庫管理</h1>
            <HelpHint>
              全SKUの現在在庫・引当数・フリー在庫数・発注閾値を一覧表示します。{"\n"}
              発注対象・在庫切れ・過剰在庫を一目で確認でき、発注計算画面と連携します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {records.length} SKU中 <span className="font-semibold">{filtered.length}</span> 件表示
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("CSVエクスポートを開始しました")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            <Download className="h-4 w-4" />CSV
          </button>
          <Link
            href="/products/inventory/update"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            <Settings2 className="h-4 w-4" />在庫更新
          </Link>
          <Link
            href="/purchasing/calculate"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
          >
            <ShoppingCart className="h-4 w-4" />発注計算へ
          </Link>
        </div>
      </div>

      {/* KPI カード（inventoryHealth 集計） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />適正
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.proper}</p>
          <p className="text-xs text-gray-400 mt-1">全 {stats.total} SKU</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4 text-amber-500" />発注対象
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.needOrder}</p>
          <p className="text-xs text-gray-400 mt-1">発注点以下</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingDown className="h-4 w-4 text-red-500" />在庫切れ
          </div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.outOfStock}</p>
          <p className="text-xs text-gray-400 mt-1">即時対応必要</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4 text-purple-500" />過剰在庫
          </div>
          <p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">{stats.overStock}</p>
          <p className="text-xs text-gray-400 mt-1">適正在庫の3倍超</p>
        </GlassCard>
      </div>

      {/* 用語説明 */}
      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <p className="text-sm font-medium text-gray-800 mb-2">在庫項目の説明</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
          <div><span className="font-medium text-blue-700">物理在庫</span>: 倉庫に実際に存在する総数（onHand）</div>
          <div><span className="font-medium text-blue-700">引当数</span>: 未出荷の受注に割り当て済の数（allocated）</div>
          <div><span className="font-medium text-blue-700">フリー在庫</span> = 物理在庫 − 引当数（販売可能数）</div>
          <div><span className="font-medium text-blue-700">在庫定数</span>: 常に保持したい目標在庫（constant）</div>
          <div><span className="font-medium text-blue-700">発注点</span>: フリー在庫がこれ以下で発注対象（reorder）</div>
          <div><span className="font-medium text-blue-700">発注ロット</span>: 発注時の最小単位（lot）</div>
        </div>
      </GlassCard>

      {/* フィルタ */}
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="SKU・商品名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "適正", "発注対象", "在庫切れ", "過剰"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">倉庫</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 在庫一覧テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名 / 倉庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">物理在庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">引当数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">フリー</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">在庫定数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">発注点</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ロット</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                  条件に該当するSKUがありません。
                </td>
              </tr>
            ) : (
              filtered.map(({ record, name, health, free }) => (
                <tr key={`${record.sku}-${record.warehouse}`} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{record.sku}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{name}</p>
                    <p className="text-xs text-gray-400">{record.warehouse}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 tabular-nums">{record.onHand}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{record.allocated}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-gray-800 tabular-nums">{free}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{record.constant}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{record.reorder}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{record.lot}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[health])}>
                      {health}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* 発注推奨セクション */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">発注推奨</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-700">
              {suggestions.length} SKU
            </span>
            <HelpHint>
              フリー在庫が発注点以下のSKUを自動抽出します。{"\n"}
              推奨発注数 = ロット単位で適正在庫まで補充する数量です。
            </HelpHint>
          </div>
          <button
            onClick={handleCreatePurchaseOrder}
            disabled={selectedSkus.size === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              selectedSkus.size > 0
                ? "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
                : "bg-white/40 border border-white/40 text-gray-400 cursor-not-allowed",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            発注書を作成
            {selectedSkus.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-xs bg-white/20">
                {selectedSkus.size}
              </span>
            )}
          </button>
        </div>

        {suggestions.length === 0 ? (
          <GlassCard className="py-10">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <ArchiveX className="h-8 w-8" />
              <p className="text-sm">発注対象のSKUはありません</p>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 w-10">
                    <input
                      type="checkbox"
                      checked={selectedSkus.size === suggestions.length}
                      onChange={toggleAllSuggestions}
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名 / 倉庫</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">フリー在庫</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">推奨発注数</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => {
                  const rec = records.find(
                    (r) => r.sku === s.sku && r.warehouse === s.warehouse,
                  );
                  const health = rec ? inventoryHealth(rec) : "発注対象";
                  return (
                    <tr
                      key={`${s.sku}-${s.warehouse}`}
                      className={cn(
                        "border-t border-white/30 hover:bg-white/40 transition-colors cursor-pointer",
                        selectedSkus.has(s.sku) && "bg-blue-500/5",
                      )}
                      onClick={() => toggleSku(s.sku)}
                    >
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedSkus.has(s.sku)}
                          onChange={() => toggleSku(s.sku)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.sku}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-gray-800">{SKU_NAMES[s.sku] ?? s.sku}</p>
                        <p className="text-xs text-gray-400">{s.warehouse}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-red-600 font-medium">
                        {s.currentFree}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums font-bold text-blue-700">
                        {s.suggestedQty}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[health])}>
                          {health}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
