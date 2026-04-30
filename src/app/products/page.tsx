"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Upload,
} from "lucide-react";

type ProductStatus = "販売中" | "停止中" | "廃番";
type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  skus: number;
  price: number;
  cost: number;
  stock: number;
  safety: number;
  status: ProductStatus;
  updated: string;
};

const initial: Product[] = [
  { id: "P001", code: "WEP-001", name: "ワイヤレスイヤホン Pro", category: "家電", skus: 3, price: 12_800, cost: 4_500, stock: 45, safety: 10, status: "販売中", updated: "2026/04/28" },
  { id: "P002", code: "UCB-002", name: "USB-Cケーブル 2m", category: "家電", skus: 1, price: 1_280, cost: 320, stock: 8, safety: 15, status: "販売中", updated: "2026/04/27" },
  { id: "P003", code: "SWB-003", name: "スマートウォッチバンド", category: "雑貨", skus: 5, price: 3_980, cost: 1_200, stock: 5, safety: 10, status: "販売中", updated: "2026/04/27" },
  { id: "P004", code: "MBT-004", name: "モバイルバッテリー 20000mAh", category: "家電", skus: 2, price: 4_980, cost: 1_800, stock: 2, safety: 8, status: "販売中", updated: "2026/04/26" },
  { id: "P005", code: "PFS-005", name: "保護フィルム セット", category: "雑貨", skus: 4, price: 1_580, cost: 380, stock: 120, safety: 20, status: "販売中", updated: "2026/04/26" },
  { id: "P006", code: "TWS-006", name: "完全ワイヤレスイヤホン", category: "家電", skus: 2, price: 8_900, cost: 3_200, stock: 0, safety: 5, status: "販売中", updated: "2026/04/25" },
  { id: "P007", code: "CHG-007", name: "急速充電器 65W", category: "家電", skus: 1, price: 3_480, cost: 1_100, stock: 67, safety: 15, status: "販売中", updated: "2026/04/25" },
  { id: "P008", code: "OLD-008", name: "旧モデルケーブル 1m", category: "家電", skus: 1, price: 680, cost: 200, stock: 234, safety: 30, status: "廃番", updated: "2026/03/15" },
  { id: "P009", code: "TEE-009", name: "コットンTシャツ", category: "アパレル", skus: 6, price: 2_980, cost: 980, stock: 350, safety: 50, status: "販売中", updated: "2026/04/20" },
  { id: "P010", code: "STP-010", name: "停止中スマホスタンド", category: "雑貨", skus: 1, price: 1_980, cost: 600, stock: 18, safety: 5, status: "停止中", updated: "2026/04/01" },
];

const tabs: { label: string; value: "list" | "inventory" | "set" }[] = [
  { label: "商品一覧", value: "list" },
  { label: "在庫管理", value: "inventory" },
  { label: "セット商品", value: "set" },
];

const stockBadge = (current: number, safety: number) => {
  if (current === 0) return { label: "在庫切れ", class: "bg-red-500/15 text-red-700", state: "out" };
  if (current <= safety) return { label: "低在庫", class: "bg-yellow-500/15 text-yellow-700", state: "low" };
  return { label: "十分", class: "bg-emerald-500/15 text-emerald-700", state: "ok" };
};

const statusMap: Record<ProductStatus, string> = {
  販売中: "bg-emerald-500/15 text-emerald-700",
  停止中: "bg-gray-500/15 text-gray-600",
  廃番: "bg-red-500/15 text-red-700",
};

export default function ProductsPage() {
  const toast = useToast();
  const [items] = useState(initial);
  const [activeTab, setActiveTab] = useState<"list" | "inventory" | "set">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "low" | "ok">("all");

  const categories = Array.from(new Set(items.map((i) => i.category)));

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((p) => {
      if (k && !`${p.code} ${p.name}`.toLowerCase().includes(k)) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (stockFilter !== "all") {
        const s = stockBadge(p.stock, p.safety).state;
        if (s !== stockFilter) return false;
      }
      return true;
    });
  }, [items, keyword, categoryFilter, statusFilter, stockFilter]);

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected((p) => (p.length === filtered.length ? [] : filtered.map((x) => x.id)));

  const hasFilter = keyword || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/products/import"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}
          >
            <Upload className="h-4 w-4" />
            一括登録
          </Link>
          <Link
            href="/products/new"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}
          >
            <Plus className="h-4 w-4" />
            商品登録
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-max sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,180px))_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="商品名・SKUで検索"
            className={cn("w-full h-9 pl-10 pr-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20")}
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">カテゴリ: すべて</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">ステータス: すべて</option>
          <option value="販売中">販売中</option>
          <option value="停止中">停止中</option>
          <option value="廃番">廃番</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">在庫: すべて</option>
          <option value="out">在庫切れ</option>
          <option value="low">低在庫</option>
          <option value="ok">十分</option>
        </select>
        {hasFilter && (
          <button
            onClick={() => { setKeyword(""); setCategoryFilter("all"); setStatusFilter("all"); setStockFilter("all"); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70 whitespace-nowrap"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="w-12 px-3 py-3" />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品コード</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">販売価格</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">原価</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">在庫</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = stockBadge(p.stock, p.safety);
                return (
                  <tr key={p.id} className={cn("border-t border-white/30 transition-colors", selected.includes(p.id) ? "bg-blue-500/5" : "hover:bg-white/40")}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-100/60 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.code}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/products/${p.id}/edit`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600">{p.category}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{p.skus}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums">¥{p.price.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-500 tabular-nums">¥{p.cost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("font-medium tabular-nums", p.stock === 0 ? "text-red-600" : p.stock <= p.safety ? "text-yellow-600" : "text-gray-700")}>
                          {p.stock}
                        </span>
                        <span className={cn("inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap", stock.class)}>
                          {stock.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", statusMap[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{p.updated}</td>
                    <td className="px-3 py-3">
                      <Link href={`/products/${p.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-12 text-center text-sm text-gray-400">該当する商品がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-white/40 bg-white/30">
          <div className="min-h-[28px]">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button onClick={() => toast.show(`${selected.length} 件のステータスを変更します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">ステータス変更</button>
                <button onClick={() => toast.show(`${selected.length} 件のカテゴリを変更します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors">カテゴリ変更</button>
                <button onClick={() => toast.show(`${selected.length} 件を削除しました`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors">削除</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} 件 / 全 {items.length} 件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
