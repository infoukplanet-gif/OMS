"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import { Search, Plus, MoreHorizontal, ShoppingCart, Truck, Banknote, AlertTriangle } from "lucide-react";

type Order = {
  id: string;
  supplier: string;
  items: number;
  amount: number;
  status: "発注中" | "一部入荷" | "入荷済" | "キャンセル";
  date: string;
  expected: string;
  daysToArrive: number;
};

const ORDERS: Order[] = [
  { id: "PO-2026-0045", supplier: "株式会社ABC電子", items: 5, amount: 245000, status: "発注中", date: "2026-04-25", expected: "2026-05-02", daysToArrive: 7 },
  { id: "PO-2026-0044", supplier: "グローバルパーツ合同会社", items: 3, amount: 128000, status: "一部入荷", date: "2026-04-23", expected: "2026-04-28", daysToArrive: 3 },
  { id: "PO-2026-0043", supplier: "株式会社ケーブルワークス", items: 8, amount: 56000, status: "入荷済", date: "2026-04-21", expected: "2026-04-25", daysToArrive: 0 },
  { id: "PO-2026-0042", supplier: "株式会社ABC電子", items: 2, amount: 89000, status: "入荷済", date: "2026-04-19", expected: "2026-04-23", daysToArrive: 0 },
  { id: "PO-2026-0041", supplier: "アジアサプライ株式会社", items: 10, amount: 342000, status: "キャンセル", date: "2026-04-17", expected: "—", daysToArrive: 0 },
  { id: "PO-2026-0040", supplier: "株式会社ABC電子", items: 4, amount: 184000, status: "発注中", date: "2026-04-25", expected: "2026-05-08", daysToArrive: 13 },
];

const STATUS_BADGE: Record<Order["status"], string> = {
  発注中: "bg-blue-500/15 text-blue-700",
  入荷済: "bg-emerald-500/15 text-emerald-700",
  一部入荷: "bg-yellow-500/15 text-yellow-700",
  キャンセル: "bg-red-500/15 text-red-700",
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PurchasingPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未完了のみ");
  const [supplierFilter, setSupplierFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return ORDERS.filter((o) => {
      if (k && !o.id.toLowerCase().includes(k) && !o.supplier.toLowerCase().includes(k)) return false;
      if (statusFilter === "未完了のみ" && (o.status === "入荷済" || o.status === "キャンセル")) return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && o.status !== statusFilter) return false;
      if (supplierFilter !== "すべて" && o.supplier !== supplierFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, supplierFilter]);

  const stats = {
    open: ORDERS.filter((o) => o.status === "発注中" || o.status === "一部入荷").length,
    arriving: ORDERS.filter((o) => o.status === "発注中" && o.daysToArrive <= 3).length,
    pending: ORDERS.filter((o) => o.status === "発注中" || o.status === "一部入荷").reduce((s, o) => s + o.amount, 0),
    received: ORDERS.filter((o) => o.status === "入荷済").length,
  };

  return (
    <div className="space-y-5">
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
            進行中: <span className="font-semibold text-blue-700">{stats.open}件</span> ／ 3日以内入荷予定:{" "}
            <span className="font-semibold text-amber-700">{stats.arriving}件</span> ／ 発注残額:{" "}
            <span className="font-semibold">{fmt(stats.pending)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/purchasing/calculate" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            <ShoppingCart className="h-4 w-4" />発注計算
          </Link>
          <Link href="/purchasing/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
            <Plus className="h-4 w-4" />新規発注
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><ShoppingCart className="h-4 w-4" />進行中の発注</div><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Truck className="h-4 w-4" />3日以内入荷</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.arriving}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="h-4 w-4" />発注残額</div><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{fmt(stats.pending)}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />本月入荷済</div><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.received}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="発注番号・仕入先" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["未完了のみ", "すべて", "発注中", "一部入荷", "入荷済", "キャンセル"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">仕入先</label>
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "株式会社ABC電子", "グローバルパーツ合同会社", "株式会社ケーブルワークス", "アジアサプライ株式会社"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">商品数</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">合計金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入荷予定</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-blue-600">{o.id}</td>
                <td className="px-3 py-2.5 text-gray-800">{o.supplier}</td>
                <td className="px-3 py-2.5 text-center text-gray-700 tabular-nums">{o.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(o.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[o.status])}>{o.status}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{o.date}</td>
                <td className={cn("px-3 py-2.5 text-xs tabular-nums", o.daysToArrive > 0 && o.daysToArrive <= 3 ? "text-amber-700 font-semibold" : "text-gray-500")}>
                  {o.expected}
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/purchasing/${o.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600">
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
