"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
} from "lucide-react";

const tabs = [
  { label: "商品一覧", value: "list" },
  { label: "在庫管理", value: "inventory" },
  { label: "セット商品", value: "set" },
];

const stockBadge = (current: number, safety: number) => {
  if (current === 0) return { label: "在庫切れ", class: "bg-red-500/15 text-red-700" };
  if (current <= safety) return { label: "低在庫", class: "bg-yellow-500/15 text-yellow-700" };
  return { label: "十分", class: "bg-emerald-500/15 text-emerald-700" };
};

const statusMap: Record<string, string> = {
  "販売中": "bg-emerald-500/15 text-emerald-700",
  "停止中": "bg-gray-500/15 text-gray-600",
  "廃番": "bg-red-500/15 text-red-700",
};

const products = [
  { id: "P001", code: "WEP-001", name: "ワイヤレスイヤホン Pro", image: null, skus: 3, price: "¥12,800", cost: "¥4,500", stock: 45, safety: 10, status: "販売中", updated: "2024/04/10" },
  { id: "P002", code: "UCB-002", name: "USB-Cケーブル 2m", image: null, skus: 1, price: "¥1,280", cost: "¥320", stock: 8, safety: 15, status: "販売中", updated: "2024/04/09" },
  { id: "P003", code: "SWB-003", name: "スマートウォッチバンド", image: null, skus: 5, price: "¥3,980", cost: "¥1,200", stock: 5, safety: 10, status: "販売中", updated: "2024/04/09" },
  { id: "P004", code: "MBT-004", name: "モバイルバッテリー 20000mAh", image: null, skus: 2, price: "¥4,980", cost: "¥1,800", stock: 2, safety: 8, status: "販売中", updated: "2024/04/08" },
  { id: "P005", code: "PFS-005", name: "保護フィルム セット", image: null, skus: 4, price: "¥1,580", cost: "¥380", stock: 120, safety: 20, status: "販売中", updated: "2024/04/08" },
  { id: "P006", code: "TWS-006", name: "完全ワイヤレスイヤホン", image: null, skus: 2, price: "¥8,900", cost: "¥3,200", stock: 0, safety: 5, status: "販売中", updated: "2024/04/07" },
  { id: "P007", code: "CHG-007", name: "急速充電器 65W", image: null, skus: 1, price: "¥3,480", cost: "¥1,100", stock: 67, safety: 15, status: "販売中", updated: "2024/04/07" },
  { id: "P008", code: "OLD-008", name: "旧モデルケーブル 1m", image: null, skus: 1, price: "¥680", cost: "¥200", stock: 234, safety: 30, status: "廃番", updated: "2024/03/15" },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === products.length ? [] : products.map((p) => p.id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/products/import"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "text-gray-700 hover:bg-white/80 transition-all"
            )}
          >
            <Upload className="h-4 w-4" />
            一括登録
          </Link>
          <Link
            href="/products/new"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
              "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
              "text-white hover:bg-blue-500/90 transition-all"
            )}
          >
            <Plus className="h-4 w-4" />
            商品登録
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="商品名・SKUで検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        {["カテゴリ", "ステータス", "在庫状態"].map((filter) => (
          <button
            key={filter}
            className={cn(
              "flex items-center gap-1 px-3 py-2 rounded-xl text-sm",
              "bg-white/50 backdrop-blur-xl border border-white/50",
              "text-gray-600 hover:bg-white/70 transition-all"
            )}
          >
            {filter}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === products.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-12 px-3 py-3" />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品コード</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SKU数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">販売価格</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">原価</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">在庫数</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = stockBadge(p.stock, p.safety);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(p.id) ? "bg-blue-500/5" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-100/60 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.code}</td>
                    <td className="px-3 py-3 font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">{p.name}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{p.skus}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">{p.price}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{p.cost}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("font-medium", p.stock === 0 ? "text-red-600" : p.stock <= p.safety ? "text-yellow-600" : "text-gray-700")}>
                          {p.stock}
                        </span>
                        <span className={cn("inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium", stock.class)}>
                          {stock.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusMap[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{p.updated}</td>
                    <td className="px-3 py-3">
                      <Link href={`/products/${p.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
          <div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{selected.length}件選択中</span>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">
                  ステータス変更
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors">
                  カテゴリ変更
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors">
                  削除
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1-8 / 8件</span>
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
