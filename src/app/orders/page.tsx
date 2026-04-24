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
} from "lucide-react";

const statusTabs = [
  { label: "すべて", count: 1449, value: "all" },
  { label: "新規受付", count: 12, value: "new" },
  { label: "確認待ち", count: 8, value: "confirming" },
  { label: "出荷待ち", count: 23, value: "shipping" },
  { label: "出荷済み", count: 156, value: "shipped" },
  { label: "完了", count: 1203, value: "completed" },
  { label: "キャンセル", count: 47, value: "cancelled" },
];

const statusBadge: Record<string, string> = {
  "新規受付": "bg-blue-500/15 text-blue-700",
  "確認待ち": "bg-yellow-500/15 text-yellow-700",
  "出荷待ち": "bg-orange-500/15 text-orange-700",
  "出荷済み": "bg-emerald-500/15 text-emerald-700",
  "完了": "bg-gray-500/15 text-gray-600",
  "キャンセル": "bg-red-500/15 text-red-700",
};

const paymentBadge: Record<string, string> = {
  "クレジットカード": "bg-purple-500/15 text-purple-700",
  "銀行振込": "bg-blue-500/15 text-blue-700",
  "代金引換": "bg-orange-500/15 text-orange-700",
  "請求書払い": "bg-teal-500/15 text-teal-700",
};

const shopColors: Record<string, string> = {
  "楽天市場": "bg-red-500",
  "Amazon": "bg-orange-400",
  "Shopify": "bg-green-500",
  "Yahoo!": "bg-purple-500",
};

const orders = [
  { id: "ORD-2024-00851", shop: "楽天市場", customer: "山田太郎", items: 3, amount: "¥32,400", payment: "クレジットカード", status: "新規受付", date: "2024/04/11 10:42" },
  { id: "ORD-2024-00850", shop: "Amazon", customer: "佐藤花子", items: 1, amount: "¥8,900", payment: "クレジットカード", status: "出荷待ち", date: "2024/04/11 10:35" },
  { id: "ORD-2024-00849", shop: "Shopify", customer: "田中一郎", items: 5, amount: "¥154,000", payment: "請求書払い", status: "確認待ち", date: "2024/04/11 10:22" },
  { id: "ORD-2024-00848", shop: "Yahoo!", customer: "鈴木美咲", items: 2, amount: "¥5,600", payment: "銀行振込", status: "出荷済み", date: "2024/04/11 09:58" },
  { id: "ORD-2024-00847", shop: "楽天市場", customer: "高橋健", items: 1, amount: "¥22,800", payment: "代金引換", status: "完了", date: "2024/04/11 09:41" },
  { id: "ORD-2024-00846", shop: "Amazon", customer: "渡辺京子", items: 4, amount: "¥45,200", payment: "クレジットカード", status: "新規受付", date: "2024/04/11 09:30" },
  { id: "ORD-2024-00845", shop: "Shopify", customer: "伊藤大輔", items: 2, amount: "¥18,600", payment: "クレジットカード", status: "出荷待ち", date: "2024/04/11 09:15" },
  { id: "ORD-2024-00844", shop: "Yahoo!", customer: "中村あかり", items: 1, amount: "¥3,200", payment: "銀行振込", status: "出荷済み", date: "2024/04/11 08:55" },
  { id: "ORD-2024-00843", shop: "楽天市場", customer: "小林修", items: 3, amount: "¥67,500", payment: "クレジットカード", status: "完了", date: "2024/04/11 08:40" },
  { id: "ORD-2024-00842", shop: "Amazon", customer: "加藤裕子", items: 2, amount: "¥12,400", payment: "代金引換", status: "キャンセル", date: "2024/04/11 08:22" },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === orders.length ? [] : orders.map((o) => o.id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注一覧</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/orders/import"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "text-gray-700 hover:bg-white/80 transition-all"
            )}
          >
            <Upload className="h-4 w-4" />
            CSVインポート
          </Link>
          <Link
            href="/orders/new"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
              "bg-blue-500/80 backdrop-blur-xl",
              "border border-blue-400/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
              "text-white hover:bg-blue-500/90 transition-all"
            )}
          >
            <Plus className="h-4 w-4" />
            受注登録
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                activeTab === tab.value
                  ? "bg-blue-500/15 text-blue-700 font-medium"
                  : "bg-gray-500/10 text-gray-500"
              )}
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="受注番号・顧客名で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        {["店舗", "期間", "支払方法", "配送方法"].map((filter) => (
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
                    checked={selected.length === orders.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">支払方法</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注日時</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={cn(
                    "border-t border-white/30 transition-colors",
                    selected.includes(order.id)
                      ? "bg-blue-500/5"
                      : "hover:bg-white/40"
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-blue-600 cursor-pointer hover:underline">{order.id}</td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", shopColors[order.shop])} />
                      {order.shop}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{order.customer}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{order.items}</td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800">{order.amount}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", paymentBadge[order.payment])}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{order.date}</td>
                  <td className="px-3 py-3">
                    <Link href={`/orders/${order.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination + Bulk Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
          <div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{selected.length}件選択中</span>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">
                  ステータス変更
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">
                  出荷指示
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 transition-colors">
                  エクスポート
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1-10 / 1,449件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400 hover:bg-white/70 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
