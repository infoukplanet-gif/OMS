"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Settings2, Package, AlertTriangle, TrendingDown, ShoppingCart, Download } from "lucide-react";

type Inv = {
  sku: string;
  name: string;
  warehouse: string;
  stock: number;
  allocated: number;
  free: number;
  constant: number;
  reorder: number;
  lot: number;
  status: "適正" | "発注対象" | "在庫切れ" | "過剰";
};

const INV: Inv[] = [
  { sku: "WEP-001-BK", name: "ワイヤレスイヤホン Pro / ブラック", warehouse: "東京本社倉庫", stock: 30, allocated: 5, free: 25, constant: 10, reorder: 15, lot: 10, status: "適正" },
  { sku: "WEP-001-WH", name: "ワイヤレスイヤホン Pro / ホワイト", warehouse: "東京本社倉庫", stock: 15, allocated: 3, free: 12, constant: 10, reorder: 15, lot: 10, status: "適正" },
  { sku: "UCB-002", name: "USB-Cケーブル 2m", warehouse: "大阪倉庫", stock: 8, allocated: 2, free: 6, constant: 20, reorder: 25, lot: 50, status: "発注対象" },
  { sku: "MBT-004", name: "モバイルバッテリー 20000mAh", warehouse: "東京本社倉庫", stock: 2, allocated: 1, free: 1, constant: 15, reorder: 20, lot: 30, status: "発注対象" },
  { sku: "TWS-006-BK", name: "完全ワイヤレスイヤホン / ブラック", warehouse: "九州物流センター", stock: 0, allocated: 0, free: 0, constant: 10, reorder: 10, lot: 20, status: "在庫切れ" },
  { sku: "CHG-007", name: "急速充電器 65W", warehouse: "東京本社倉庫", stock: 67, allocated: 8, free: 59, constant: 30, reorder: 40, lot: 50, status: "適正" },
  { sku: "PFS-005", name: "保護フィルム セット", warehouse: "東京本社倉庫", stock: 482, allocated: 12, free: 470, constant: 50, reorder: 80, lot: 100, status: "過剰" },
  { sku: "TS-WH-M", name: "Tシャツ ホワイト M", warehouse: "九州物流センター", stock: 30, allocated: 4, free: 26, constant: 20, reorder: 30, lot: 50, status: "適正" },
  { sku: "JK-NV-L", name: "ジャケット ネイビー L", warehouse: "大阪倉庫", stock: 5, allocated: 1, free: 4, constant: 15, reorder: 20, lot: 25, status: "発注対象" },
];

const STATUS_BADGE: Record<Inv["status"], string> = {
  適正: "bg-emerald-500/15 text-emerald-700",
  発注対象: "bg-yellow-500/15 text-yellow-700",
  在庫切れ: "bg-red-500/15 text-red-700",
  過剰: "bg-purple-500/15 text-purple-700",
};

export default function InventoryPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [warehouseFilter, setWarehouseFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return INV.filter((i) => {
      if (k && !i.sku.toLowerCase().includes(k) && !i.name.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && i.status !== statusFilter) return false;
      if (warehouseFilter !== "すべて" && i.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, warehouseFilter]);

  const stats = {
    total: INV.length,
    needOrder: INV.filter((i) => i.status === "発注対象").length,
    outOfStock: INV.filter((i) => i.status === "在庫切れ").length,
    overStock: INV.filter((i) => i.status === "過剰").length,
  };

  return (
    <div className="space-y-5">
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
            {INV.length} SKU中 <span className="font-semibold">{filtered.length}</span> 件表示
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("CSVエクスポートを開始しました")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Download className="h-4 w-4" />CSV
          </button>
          <Link
            href="/products/inventory/update"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Settings2 className="h-4 w-4" />在庫更新
          </Link>
          <Link
            href="/purchasing/calculate"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
          >
            <ShoppingCart className="h-4 w-4" />発注計算へ
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Package className="h-4 w-4" />総SKU数</div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.total}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />発注対象</div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.needOrder}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingDown className="h-4 w-4" />在庫切れ</div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.outOfStock}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Package className="h-4 w-4" />過剰在庫</div>
          <p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">{stats.overStock}</p>
        </GlassCard>
      </div>

      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <p className="text-sm font-medium text-gray-800 mb-2">在庫項目の説明</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
          <div><span className="font-medium text-blue-700">在庫数</span>: 倉庫に実際に存在する総数</div>
          <div><span className="font-medium text-blue-700">引当数</span>: 未出荷の受注に割り当て済の数</div>
          <div><span className="font-medium text-blue-700">フリー在庫数</span> = 在庫数 − 引当数（販売可能数）</div>
          <div><span className="font-medium text-blue-700">在庫定数</span>: 常に保持したい目標在庫</div>
          <div><span className="font-medium text-blue-700">発注点</span>: 下回ると発注計算対象</div>
          <div><span className="font-medium text-blue-700">発注ロット</span>: 発注時の最小単位</div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="SKU・商品名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "適正", "発注対象", "在庫切れ", "過剰"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">倉庫</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名 / 倉庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">在庫数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">引当数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">フリー</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">在庫定数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">発注点</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ロット</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-12 text-center text-gray-400">条件に該当するSKUがありません。</td></tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.sku} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.sku}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.warehouse}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 tabular-nums">{i.stock}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{i.allocated}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-gray-800 tabular-nums">{i.free}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{i.constant}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{i.reorder}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums">{i.lot}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[i.status])}>{i.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
