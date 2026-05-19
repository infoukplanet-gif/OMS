"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  type PurchaseOrderStatus,
  PURCHASE_ORDER_STATUSES,
  purchaseStatusBadge,
  type PurchaseOrderLine,
} from "@/lib/state-machines/purchase";
import {
  purchaseStore,
  type PurchaseOrderRecord,
} from "@/lib/stores/purchase";
import { inventoryStore } from "@/lib/stores/inventory";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
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

/**
 * 画面表示で使う発注書レコード。state-machine の (status, lines) に加えて
 * 一覧表示で使う非SM フィールド（仕入先・金額・予定日など）を持つ。
 * purchaseStore は extra: unknown で受けるためここで具体型を再宣言する。
 */
type PurchaseOrder = PurchaseOrderRecord & {
  supplier: string;
  items: number;
  amount: number;
  date: string;
  expected: string;
  daysToArrive: number;
};

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

const line = (sku: string, warehouse: string, ordered: number, received = 0): PurchaseOrderLine => ({
  sku,
  warehouse,
  orderedQty: ordered,
  receivedQty: received,
});

// INITIAL_INVENTORY と同じ SKU を使うことで、入荷登録時の cascade が
// inventoryStore.onHand に確実に反映される。
const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2026-0049",
    supplier: "フジタ資材株式会社",
    items: 3,
    amount: 67000,
    status: "条件未達成",
    lines: [line("UCB-002", "大阪倉庫", 20)],
    date: "2026-05-10",
    expected: "—",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0048",
    supplier: "東亜電機株式会社",
    items: 6,
    amount: 198000,
    status: "未発行",
    lines: [line("CHG-007", "東京本社倉庫", 30)],
    date: "2026-05-08",
    expected: "—",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0047",
    supplier: "株式会社ABC電子",
    items: 5,
    amount: 245000,
    status: "発行済",
    lines: [line("MBT-004", "東京本社倉庫", 30)],
    date: "2026-04-25",
    expected: "2026-05-21",
    daysToArrive: 2,
  },
  {
    id: "PO-2026-0046",
    supplier: "グローバルパーツ合同会社",
    items: 3,
    amount: 128000,
    status: "注残あり",
    lines: [line("TWS-006-BK", "九州物流センター", 20, 6)],
    date: "2026-04-23",
    expected: "2026-05-22",
    daysToArrive: 3,
  },
  {
    id: "PO-2026-0045",
    supplier: "株式会社ケーブルワークス",
    items: 8,
    amount: 56000,
    status: "仕入完了",
    lines: [line("WEP-001-BK", "東京本社倉庫", 10, 10)],
    date: "2026-04-21",
    expected: "2026-04-25",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0044",
    supplier: "株式会社ABC電子",
    items: 2,
    amount: 89000,
    status: "仕入完了",
    lines: [line("JK-NV-L", "大阪倉庫", 25, 25)],
    date: "2026-04-19",
    expected: "2026-04-23",
    daysToArrive: 0,
  },
  {
    id: "PO-2026-0043",
    supplier: "アジアサプライ株式会社",
    items: 10,
    amount: 342000,
    status: "キャンセル",
    lines: [line("PFS-005", "東京本社倉庫", 100)],
    date: "2026-04-17",
    expected: "—",
    daysToArrive: 0,
  },
];

export default function PurchasingPage() {
  // shared store seeding（最初にマウントされた画面が空ストアを埋める）。
  useEffect(() => {
    if (purchaseStore.getState().length === 0) {
      purchaseStore.setItems(INITIAL_ORDERS);
    }
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
  }, []);

  const storeItems = useSyncExternalStore(
    (cb) => purchaseStore.subscribe(cb),
    () => purchaseStore.getState(),
    () => INITIAL_ORDERS,
  );
  const orders = storeItems as ReadonlyArray<PurchaseOrder>;

  const [activeTab, setActiveTab] = useState<"all" | PurchaseOrderStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("すべて");
  const toast = useToast();

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
    inProgress: orders.filter((o) => o.status === "発行済" || o.status === "注残あり").length,
    arriving: orders.filter(
      (o) => (o.status === "発行済" || o.status === "注残あり") && o.daysToArrive > 0 && o.daysToArrive <= 3,
    ).length,
    pendingAmount: orders
      .filter((o) => o.status === "発行済" || o.status === "注残あり")
      .reduce((s, o) => s + o.amount, 0),
    completed: orders.filter((o) => o.status === "仕入完了").length,
  }), [orders]);

  function handleIssue(o: PurchaseOrder) {
    const result = purchaseStore.applyIssue(o.id);
    if (!result.applied) {
      toast.show(`${o.id} は発行できません`, "info");
      return;
    }
    toast.show(`${o.id} を発行済にしました`, "success");
  }

  /**
   * モック受領: 全明細を残数（orderedQty - receivedQty）で受領し、
   * purchase SM 経由で状態を更新 → effects.receiveInventory を inventoryStore に流して
   * onHand を加算する。実プロジェクトでは受領数量入力モーダルに置き換える。
   */
  function handleReceive(o: PurchaseOrder) {
    const receipts = o.lines
      .map((l) => ({
        sku: l.sku,
        warehouse: l.warehouse,
        qty: l.orderedQty - l.receivedQty,
      }))
      .filter((r) => r.qty > 0);

    if (receipts.length === 0) {
      toast.show(`${o.id} は受領残がありません`, "info");
      return;
    }

    const result = purchaseStore.applyReceive(o.id, receipts);
    if (!result.applied) {
      toast.show(`${o.id} は入荷登録できません`, "info");
      return;
    }

    let stockAdded = 0;
    let unknownCount = 0;
    if (result.effects.receiveInventory) {
      const cascade = inventoryStore.applyReceive(result.effects.receiveInventory.lines);
      stockAdded = cascade.appliedCount;
      unknownCount = cascade.unknownReceipts.length;
    }

    const totalQty = receipts.reduce((s, r) => s + r.qty, 0);
    const detail = [
      `${totalQty}個受領`,
      `在庫加算 ${stockAdded}SKU`,
      unknownCount > 0 ? `未登録SKU ${unknownCount}件` : "",
      result.after?.status === "仕入完了" ? "→ 仕入完了" : "",
    ]
      .filter(Boolean)
      .join("・");

    toast.show(`${o.id}: ${detail}`, unknownCount > 0 ? "info" : "success");
  }

  function handleCancel(o: PurchaseOrder) {
    const result = purchaseStore.applyCancel(o.id);
    if (!result.applied) {
      toast.show(`${o.id} は取消できません`, "info");
      return;
    }
    toast.show(`${o.id} を取消しました`, "success");
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
              入荷登録すると発注書の状態が更新され、対応する SKU の在庫（onHand）が自動加算されます。
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
