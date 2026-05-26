"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { orderStore, type OrderRecord } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { allocatePendingOrders } from "@/lib/cascades/allocate-orders";
import { freeStock, type AllocationLine } from "@/lib/state-machines/inventory";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_INVENTORY, SKU_NAMES } from "@/lib/seeds/inventory";
import { AlertTriangle, Search, RefreshCw, ShoppingCart, PackageX } from "lucide-react";

const fmt = (n: number) => `¥${n.toLocaleString()}`;

type ShortageRow = {
  orderId: string;
  customer: string;
  shop: string;
  date: string;
  amount: number;
  sku: string;
  product: string;
  needed: number;
  available: number;
  reason: "在庫切れ" | "一部不足";
};

export default function ShipmentsShortagePage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [reasonFilter, setReasonFilter] = useState("すべて");

  // 引当は共有ストア上で実行・集計する。order/inventory を seed。
  useEffect(() => {
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);

  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS,
  ) as ReadonlyArray<OrderRecord>;

  const inventory = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => INITIAL_INVENTORY,
  );

  // SKU 横断のフリー在庫合計（全倉庫）
  const freeBySku = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of inventory) {
      map.set(r.sku, (map.get(r.sku) ?? 0) + Math.max(0, freeStock(r)));
    }
    return map;
  }, [inventory]);

  // 在庫不足としてマークされた引当待ち受注 → 明細単位の行に展開
  const rows = useMemo<ShortageRow[]>(() => {
    const out: ShortageRow[] = [];
    for (const o of orders) {
      if (o.status !== "引当待ち" || o.inventoryShortage !== true) continue;
      const allocation = (o.allocation as AllocationLine[] | undefined) ?? [];
      // SKU 単位に集約
      const bySku = new Map<string, number>();
      for (const l of allocation) bySku.set(l.sku, (bySku.get(l.sku) ?? 0) + l.qty);
      for (const [sku, needed] of bySku) {
        const available = freeBySku.get(sku) ?? 0;
        if (available >= needed) continue; // この SKU は足りている
        out.push({
          orderId: o.id,
          customer: (o.customer as string) ?? "—",
          shop: (o.shop as string) ?? "—",
          date: (o.date as string) ?? "",
          amount: (o.amount as number) ?? 0,
          sku,
          product: SKU_NAMES[sku] ?? sku,
          needed,
          available,
          reason: available <= 0 ? "在庫切れ" : "一部不足",
        });
      }
    }
    return out;
  }, [orders, freeBySku]);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !`${r.orderId} ${r.customer} ${r.sku} ${r.product}`.toLowerCase().includes(k)) return false;
      if (reasonFilter !== "すべて" && r.reason !== reasonFilter) return false;
      return true;
    });
  }, [rows, keyword, reasonFilter]);

  const stats = useMemo(() => {
    const orderIds = new Set(rows.map((r) => r.orderId));
    return {
      open: orderIds.size,
      short: rows.reduce((s, r) => s + Math.max(0, r.needed - r.available), 0),
      coverable: rows.reduce((s, r) => s + Math.min(r.needed, r.available), 0),
      impact: [...orderIds].reduce((s, id) => s + (rows.find((r) => r.orderId === id)?.amount ?? 0), 0),
    };
  }, [rows]);

  /** 当該受注の引当を再試行（入荷等で在庫が回復していれば印刷待ちへ進み、リストから外れる）。 */
  const retry = (orderId: string) => {
    const res = allocatePendingOrders({ orderStore, inventoryStore }, { orderIds: [orderId] });
    if (res.allocated > 0) {
      toast.show(`${orderId} の引当が成立しました（印刷待ちへ前進）`, "success");
    } else {
      toast.show(`${orderId}: 在庫が依然として不足しています`, "info");
    }
  };

  /** 全件まとめて引当再試行。 */
  const retryAll = () => {
    const ids = [...new Set(rows.map((r) => r.orderId))];
    if (ids.length === 0) {
      toast.show("在庫不足の受注はありません", "info");
      return;
    }
    const res = allocatePendingOrders({ orderStore, inventoryStore }, { orderIds: ids });
    toast.show(
      `一括再試行: ${res.allocated}件成立 / ${res.shortage}件は依然不足`,
      res.allocated > 0 ? "success" : "info",
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">欠品・不良欠品処理</h1>
            <HelpHint>
              在庫不足で引当できずブロックされている受注（引当待ち＋在庫不足マーク）を一覧表示。{"\n"}
              入荷などで在庫が回復したら「引当再試行」で印刷待ちへ進めます。回復見込みが無ければ発注計算へ。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未解決: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 売上影響:{" "}
            <span className="font-semibold text-red-700">{fmt(stats.impact)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={retryAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <RefreshCw className="h-4 w-4" />一括引当再試行
          </button>
          <Link href="/purchasing/calculate">
            <PrimaryButton>
              <ShoppingCart className="h-4 w-4" />発注計算へ
            </PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未解決受注</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">在庫充当可能</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.coverable}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">不足数量</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.short}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">売上影響</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{fmt(stats.impact)}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名・SKU・商品名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">理由</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "在庫切れ", "一部不足"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客 / 店舗</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">必要/フリー在庫</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">影響額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-gray-400">
                  <PackageX className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  在庫不足の受注はありません。引当に失敗した受注（引当待ち＋在庫不足）がここに表示されます。
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={`${r.orderId}:${r.sku}`} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.orderId}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{r.customer}</p>
                    <p className="text-[10px] text-gray-500">{r.shop}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{r.product}</p>
                    <p className="text-[10px] font-mono text-gray-500">{r.sku}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="tabular-nums">
                      <span className="text-gray-700">{r.needed}</span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span className={cn(r.available < r.needed ? "text-red-600 font-bold" : "text-emerald-600")}>{r.available}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.reason === "在庫切れ" ? "bg-red-500/15 text-red-700" : "bg-amber-500/15 text-amber-700",
                    )}>
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => retry(r.orderId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      <RefreshCw className="h-3 w-3" />引当再試行
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">代替提案テンプレート</h2>
          <HelpHint>顧客に代替商品を提案する際の標準文面。商品コードを差し込むと自動展開されます。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "在庫切れ → 上位互換提案", desc: "より高品質な代替商品を提示し、差額無料で対応" },
            { name: "在庫切れ → 同等品提案", desc: "同価格帯の代替商品を提示" },
            { name: "未入荷 → 入荷待ち or キャンセル選択", desc: "入荷予定日を案内し、待つかキャンセルを選択" },
          ].map((t) => (
            <div key={t.name} className="p-3 rounded-xl bg-white/50 border border-white/40">
              <p className="text-sm font-medium text-gray-800">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
