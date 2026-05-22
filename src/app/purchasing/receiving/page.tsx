"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, PackageCheck, Truck, CalendarClock, AlertTriangle, ArrowRight } from "lucide-react";
import { purchaseStore } from "@/lib/stores/purchase";
import { inventoryStore } from "@/lib/stores/inventory";
import { purchaseStatusBadge } from "@/lib/state-machines/purchase";
import { INITIAL_INVENTORY, SKU_NAMES } from "@/lib/seeds/inventory";
import {
  INITIAL_PURCHASE_ORDERS,
  type SeededPurchaseOrder,
} from "@/lib/seeds/purchase-orders";

/** 入荷予定の対象ステータス（発行済 / 注残あり のみ予定納期登録・入荷登録できる）。 */
const RECEIVABLE = ["発行済", "注残あり"] as const;

const fmtYMD = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
const parseYMD = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split("/").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const rowKey = (poId: string, sku: string, warehouse: string) => `${poId}@@${sku}@@${warehouse}`;

interface PlanRow {
  key: string;
  poId: string;
  supplier: string;
  poStatus: SeededPurchaseOrder["status"];
  sku: string;
  name: string;
  warehouse: string;
  orderedQty: number;
  receivedQty: number;
  remaining: number;
  expectedDate?: string;
}

export default function ReceivingPage() {
  const toast = useToast();
  const today = fmtYMD(new Date());

  useEffect(() => {
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
    if (purchaseStore.getState().length === 0) purchaseStore.setItems(INITIAL_PURCHASE_ORDERS);
  }, []);

  const purchaseOrders = useSyncExternalStore(
    (cb) => purchaseStore.subscribe(cb),
    () => purchaseStore.getState(),
    () => INITIAL_PURCHASE_ORDERS,
  );

  // 発行済 / 注残あり の発注伝票を明細単位の入荷予定行に展開する。
  const allRows = useMemo<PlanRow[]>(() => {
    const out: PlanRow[] = [];
    for (const poRecord of purchaseOrders) {
      const po = poRecord as SeededPurchaseOrder;
      if (!RECEIVABLE.includes(po.status as (typeof RECEIVABLE)[number])) continue;
      for (const l of po.lines) {
        out.push({
          key: rowKey(po.id, l.sku, l.warehouse),
          poId: po.id,
          supplier: po.supplier,
          poStatus: po.status,
          sku: l.sku,
          name: SKU_NAMES[l.sku] ?? l.sku,
          warehouse: l.warehouse,
          orderedQty: l.orderedQty,
          receivedQty: l.receivedQty,
          remaining: Math.max(0, l.orderedQty - l.receivedQty),
          expectedDate: l.expectedDate,
        });
      }
    }
    return out;
  }, [purchaseOrders]);

  const suppliers = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.supplier))).sort(),
    [allRows],
  );
  const warehouses = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.warehouse))).sort(),
    [allRows],
  );

  const [keyword, setKeyword] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("すべて");
  const [warehouseFilter, setWarehouseFilter] = useState("すべて");
  const [dueFilter, setDueFilter] = useState<"すべて" | "遅延" | "本日" | "未設定">("すべて");

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return allRows.filter((r) => {
      if (kw && !`${r.sku} ${r.name} ${r.poId}`.toLowerCase().includes(kw)) return false;
      if (supplierFilter !== "すべて" && r.supplier !== supplierFilter) return false;
      if (warehouseFilter !== "すべて" && r.warehouse !== warehouseFilter) return false;
      if (dueFilter === "遅延" && !(r.remaining > 0 && r.expectedDate && r.expectedDate < today)) return false;
      if (dueFilter === "本日" && r.expectedDate !== today) return false;
      if (dueFilter === "未設定" && r.expectedDate) return false;
      return true;
    });
  }, [allRows, keyword, supplierFilter, warehouseFilter, dueFilter, today]);

  // KPI
  const totalRemaining = allRows.reduce((s, r) => s + r.remaining, 0);
  const overdueCount = allRows.filter(
    (r) => r.remaining > 0 && r.expectedDate && r.expectedDate < today,
  ).length;
  const dueTodayCount = allRows.filter((r) => r.expectedDate === today && r.remaining > 0).length;
  const noDateCount = allRows.filter((r) => r.remaining > 0 && !r.expectedDate).length;

  // 選択（一括入荷登録用）。デフォルト未選択。
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const visibleReceivable = rows.filter((r) => r.remaining > 0);
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allChecked = visibleReceivable.length > 0 && visibleReceivable.every((r) => selected.has(r.key));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(visibleReceivable.map((r) => r.key)));

  /** 1明細を残数で入荷登録 → 在庫加算 cascade。 */
  const receiveRow = (r: PlanRow) => {
    if (r.remaining <= 0) return;
    const result = purchaseStore.applyReceive(r.poId, [
      { sku: r.sku, warehouse: r.warehouse, qty: r.remaining },
    ]);
    if (!result.applied) {
      toast.show(`${r.poId} は入荷登録できません`, "info");
      return;
    }
    let added = 0;
    if (result.effects.receiveInventory) {
      added = inventoryStore.applyReceive(result.effects.receiveInventory.lines).appliedCount;
    }
    const done = result.after?.status === "仕入完了" ? "・仕入完了" : "";
    toast.show(`${r.sku} ${r.remaining}個を入荷（在庫+${added}SKU${done}）`, "success");
  };

  /** 選択明細をPOごとにまとめて一括入荷登録。 */
  const receiveSelected = () => {
    const targets = visibleReceivable.filter((r) => selected.has(r.key));
    if (targets.length === 0) return;
    const byPo = new Map<string, { sku: string; warehouse: string; qty: number }[]>();
    for (const r of targets) {
      const list = byPo.get(r.poId) ?? [];
      list.push({ sku: r.sku, warehouse: r.warehouse, qty: r.remaining });
      byPo.set(r.poId, list);
    }
    let receivedLines = 0;
    let stockAdded = 0;
    for (const [poId, receipts] of byPo) {
      const result = purchaseStore.applyReceive(poId, receipts);
      if (!result.applied) continue;
      receivedLines += receipts.length;
      if (result.effects.receiveInventory) {
        stockAdded += inventoryStore.applyReceive(result.effects.receiveInventory.lines).appliedCount;
      }
    }
    setSelected(new Set());
    toast.show(`${receivedLines}明細を一括入荷（在庫+${stockAdded}SKU）`, "success");
  };

  /** 予定納期の手動登録。 */
  const setExpected = (r: PlanRow, date: Date | undefined) => {
    const value = date ? fmtYMD(date) : "";
    const result = purchaseStore.applySetExpectedDate(r.poId, r.sku, r.warehouse, value);
    if (result.applied) {
      toast.show(`${r.sku} の予定納期を${value ? ` ${value} に` : "クリア"}設定しました`, "success");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入荷予定</h1>
            <HelpHint>
              発行済・注残ありの発注伝票を明細単位で入荷予定として一覧します。
              予定納期は明細ごとに手動で登録できます。入荷登録すると発注残が消し込まれ、
              対応する SKU の在庫（onHand）が自動加算されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">予定納期の管理と入荷登録（倉庫連携）を行います。</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/purchasing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            発注一覧へ<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-xs text-gray-500">入荷予定明細</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{allRows.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-gray-500">発注残（合計）</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalRemaining}<span className="text-sm font-normal text-gray-400 ml-1">点</span></p>
        </GlassCard>
        <GlassCard className={cn(overdueCount > 0 && "bg-red-500/5 border-red-500/20")}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={cn("h-3.5 w-3.5", overdueCount > 0 ? "text-red-500" : "text-gray-400")} />
            <p className="text-xs text-gray-500">予定納期超過</p>
          </div>
          <p className={cn("text-2xl font-bold mt-1", overdueCount > 0 ? "text-red-600" : "text-gray-800")}>
            {overdueCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span>
          </p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-cyan-500" />
            <p className="text-xs text-gray-500">本日入荷予定</p>
          </div>
          <p className="text-2xl font-bold text-cyan-600 mt-1">{dueTodayCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
        </GlassCard>
      </div>

      {/* フィルター */}
      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="SKU・商品名・発注番号で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option>すべて</option>
            {suppliers.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option>すべて</option>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as typeof dueFilter)}
            className="px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="すべて">納期：すべて</option>
            <option value="遅延">納期：超過のみ</option>
            <option value="本日">納期：本日</option>
            <option value="未設定">納期：未設定</option>
          </select>
        </div>
      </GlassCard>

      {/* 入荷予定テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            入荷予定一覧（{rows.length}件 / 選択 {selected.size}件）
          </h2>
          <button
            onClick={receiveSelected}
            disabled={selected.size === 0}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              selected.size > 0
                ? "bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed",
            )}
          >
            <PackageCheck className="h-3.5 w-3.5" />選択明細を一括入荷（{selected.size}）
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-2 py-2">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">発注番号</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">仕入先</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">SKU</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">商品名</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">倉庫</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注数</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">入荷済</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">発注残</th>
                <th className="px-2 py-2 text-left font-medium text-gray-500">予定納期</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">状態</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-400">
                    入荷予定の発注伝票がありません。
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const overdue = r.remaining > 0 && r.expectedDate && r.expectedDate < today;
                  const isToday = r.expectedDate === today;
                  return (
                    <tr
                      key={r.key}
                      className={cn(
                        "border-t border-white/30 transition-colors",
                        selected.has(r.key) ? "bg-blue-500/5" : "hover:bg-white/40",
                      )}
                    >
                      <td className="px-2 py-2">
                        {r.remaining > 0 ? (
                          <input type="checkbox" checked={selected.has(r.key)} onChange={() => toggle(r.key)} className="rounded border-gray-300" />
                        ) : null}
                      </td>
                      <td className="px-2 py-2 font-mono text-gray-500">{r.poId}</td>
                      <td className="px-2 py-2 text-gray-600">{r.supplier}</td>
                      <td className="px-2 py-2 font-mono text-gray-500">{r.sku}</td>
                      <td className="px-2 py-2 text-gray-800">{r.name}</td>
                      <td className="px-2 py-2 text-gray-600">{r.warehouse}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.orderedQty}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.receivedQty}</td>
                      <td className={cn("px-2 py-2 text-center font-medium", r.remaining > 0 ? "text-amber-600" : "text-gray-400")}>{r.remaining}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <DatePicker
                            compact
                            value={parseYMD(r.expectedDate)}
                            placeholder="未設定"
                            onChange={(d) => setExpected(r, d)}
                          />
                          {overdue && <span className="text-[10px] font-medium text-red-600 whitespace-nowrap">超過</span>}
                          {isToday && r.remaining > 0 && <span className="text-[10px] font-medium text-cyan-600 whitespace-nowrap">本日</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium", purchaseStatusBadge[r.poStatus])}>
                          {r.poStatus}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {r.remaining > 0 ? (
                          <button
                            onClick={() => receiveRow(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/80 border border-cyan-400/50 text-white hover:bg-cyan-500/90"
                          >
                            <Truck className="h-3 w-3" />入荷登録
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
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

      {noDateCount > 0 && (
        <p className="text-xs text-gray-500">
          ※ 予定納期が未設定の入荷予定が {noDateCount} 件あります。明細ごとに予定納期を登録してください。
        </p>
      )}
    </div>
  );
}
