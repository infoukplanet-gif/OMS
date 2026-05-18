"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  type PurchaseOrderStatus,
  PURCHASE_ORDER_STATUSES,
  purchaseStatusBadge,
  issue,
  receivePurchaseOrder,
  cancel,
  type PurchaseOrderState,
} from "@/lib/state-machines/purchase";
import {
  Search,
  Plus,
  MoreHorizontal,
  ShoppingCart,
  Truck,
  Banknote,
  CheckCircle2,
  FileText,
  PackageCheck,
  X,
} from "lucide-react";

type PurchaseOrder = {
  id: string;
  supplier: string;
  items: number;
  amount: number;
  status: PurchaseOrderStatus;
  date: string;
  expected: string;
  daysToArrive: number;
  /** 状態機械の集約（アクション実行時に使用） */
  state: PurchaseOrderState;
};

const SAMPLE_LINES = [
  { sku: "SKU-001", warehouse: "東京倉庫", orderedQty: 10, receivedQty: 0 },
];

const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2026-0049",
    supplier: "フジタ資材株式会社",
    items: 3,
    amount: 67000,
    status: "条件未達成",
    date: "2026-05-10",
    expected: "—",
    daysToArrive: 0,
    state: { status: "条件未達成", lines: SAMPLE_LINES },
  },
  {
    id: "PO-2026-0048",
    supplier: "東亜電機株式会社",
    items: 6,
    amount: 198000,
    status: "未発行",
    date: "2026-05-08",
    expected: "—",
    daysToArrive: 0,
    state: { status: "未発行", lines: SAMPLE_LINES },
  },
  {
    id: "PO-2026-0047",
    supplier: "株式会社ABC電子",
    items: 5,
    amount: 245000,
    status: "発行済",
    date: "2026-04-25",
    expected: "2026-05-17",
    daysToArrive: 2,
    state: {
      status: "発行済",
      lines: [{ sku: "SKU-002", warehouse: "大阪倉庫", orderedQty: 5, receivedQty: 0 }],
    },
  },
  {
    id: "PO-2026-0046",
    supplier: "グローバルパーツ合同会社",
    items: 3,
    amount: 128000,
    status: "注残あり",
    date: "2026-04-23",
    expected: "2026-05-18",
    daysToArrive: 3,
    state: {
      status: "注残あり",
      lines: [{ sku: "SKU-003", warehouse: "東京倉庫", orderedQty: 6, receivedQty: 2 }],
    },
  },
  {
    id: "PO-2026-0045",
    supplier: "株式会社ケーブルワークス",
    items: 8,
    amount: 56000,
    status: "仕入完了",
    date: "2026-04-21",
    expected: "2026-04-25",
    daysToArrive: 0,
    state: {
      status: "仕入完了",
      lines: [{ sku: "SKU-004", warehouse: "東京倉庫", orderedQty: 8, receivedQty: 8 }],
    },
  },
  {
    id: "PO-2026-0044",
    supplier: "株式会社ABC電子",
    items: 2,
    amount: 89000,
    status: "仕入完了",
    date: "2026-04-19",
    expected: "2026-04-23",
    daysToArrive: 0,
    state: {
      status: "仕入完了",
      lines: [{ sku: "SKU-005", warehouse: "大阪倉庫", orderedQty: 2, receivedQty: 2 }],
    },
  },
  {
    id: "PO-2026-0043",
    supplier: "アジアサプライ株式会社",
    items: 10,
    amount: 342000,
    status: "キャンセル",
    date: "2026-04-17",
    expected: "—",
    daysToArrive: 0,
    state: { status: "キャンセル", lines: SAMPLE_LINES },
  },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

const tabs: { label: string; value: "all" | PurchaseOrderStatus }[] = [
  { label: "すべて", value: "all" },
  ...PURCHASE_ORDER_STATUSES.map((s) => ({ label: s, value: s as PurchaseOrderStatus })),
];

const suppliers = [
  "株式会社ABC電子",
  "グローバルパーツ合同会社",
  "株式会社ケーブルワークス",
  "アジアサプライ株式会社",
  "フジタ資材株式会社",
  "東亜電機株式会社",
];

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<"all" | PurchaseOrderStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return orders.filter((o) => {
      if (activeTab !== "all" && o.status !== activeTab) return false;
      if (k && !o.id.toLowerCase().includes(k) && !o.supplier.toLowerCase().includes(k)) return false;
      if (supplierFilter !== "すべて" && o.supplier !== supplierFilter) return false;
      return true;
    });
  }, [orders, activeTab, keyword, supplierFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const stats = useMemo(() => ({
    /** 進行中 = 発行済 + 注残あり */
    inProgress: orders.filter((o) => o.status === "発行済" || o.status === "注残あり").length,
    /** 3日以内入荷予定（発行済のみ） */
    arriving: orders.filter((o) => (o.status === "発行済" || o.status === "注残あり") && o.daysToArrive > 0 && o.daysToArrive <= 3).length,
    /** 発注残額（発行済 + 注残あり） */
    pendingAmount: orders
      .filter((o) => o.status === "発行済" || o.status === "注残あり")
      .reduce((s, o) => s + o.amount, 0),
    /** 今月仕入完了件数 */
    completed: orders.filter((o) => o.status === "仕入完了").length,
  }), [orders]);

  /** 状態機械プリミティブを使って注文を更新する共通関数 */
  function updateOrderState(id: string, nextState: PurchaseOrderState) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: nextState.status, state: nextState }
          : o
      )
    );
  }

  function handleIssue(o: PurchaseOrder) {
    const next = issue(o.state);
    updateOrderState(o.id, next);
  }

  function handleReceive(o: PurchaseOrder) {
    // モック受領: 全明細を発注数分で完了させる
    const receipts = o.state.lines.map((l) => ({
      sku: l.sku,
      warehouse: l.warehouse,
      qty: l.orderedQty - l.receivedQty,
    }));
    const next = receivePurchaseOrder(o.state, receipts);
    updateOrderState(o.id, next);
  }

  function handleCancel(o: PurchaseOrder) {
    const next = cancel(o.state);
    updateOrderState(o.id, next);
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">発注・仕入管理</h1>
            <HelpHint>
              発注伝票・仕入伝票を一元管理します。{"\n"}
              発注計算と連携し、入荷予定・支払期日も追跡できます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            進行中:{" "}
            <span className="font-semibold text-blue-700">{stats.inProgress}件</span>{" "}
            ／ 3日以内入荷予定:{" "}
            <span className="font-semibold text-amber-700">{stats.arriving}件</span>{" "}
            ／ 発注残額:{" "}
            <span className="font-semibold">{fmt(stats.pendingAmount)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/purchasing/calculate"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />発注計算
          </Link>
          <Link
            href="/purchasing/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all"
          >
            <Plus className="h-4 w-4" />新規発注
          </Link>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />進行中の発注
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.inProgress}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Truck className="h-4 w-4" />3日以内入荷
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.arriving}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />発注残額
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{fmt(stats.pendingAmount)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4" />本月仕入完了
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.completed}</p>
        </GlassCard>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeTab === t.value
                ? "bg-white/80 shadow-sm text-gray-800"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {t.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-xs tabular-nums",
              activeTab === t.value ? "bg-gray-100 text-gray-600" : "bg-white/50 text-gray-400"
            )}>
              {counts[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* フィルタ行 */}
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="発注番号・仕入先"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">仕入先</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option>すべて</option>
              {suppliers.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">仕入先</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発注日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入荷予定</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">
                  該当する発注書がありません
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-3 py-2.5 font-medium text-blue-600">{o.id}</td>
                <td className="px-3 py-2.5 text-gray-800">{o.supplier}</td>
                <td className="px-3 py-2.5 text-center text-gray-700 tabular-nums">{o.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(o.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", purchaseStatusBadge[o.status])}>
                    {o.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{o.date}</td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-xs tabular-nums",
                    o.daysToArrive > 0 && o.daysToArrive <= 3
                      ? "text-amber-700 font-semibold"
                      : "text-gray-500"
                  )}
                >
                  {o.expected}
                </td>
                {/* 状態機械プリミティブ経由のアクションボタン */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {o.status === "未発行" && (
                      <button
                        onClick={() => handleIssue(o)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 transition-colors"
                      >
                        <FileText className="h-3 w-3" />発行
                      </button>
                    )}
                    {(o.status === "発行済" || o.status === "注残あり") && (
                      <button
                        onClick={() => handleReceive(o)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors"
                      >
                        <PackageCheck className="h-3 w-3" />入荷登録
                      </button>
                    )}
                    {o.status !== "仕入完了" && o.status !== "キャンセル" && (
                      <button
                        onClick={() => handleCancel(o)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors"
                      >
                        <X className="h-3 w-3" />取消
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/purchasing/${o.id}/edit`}
                    className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
