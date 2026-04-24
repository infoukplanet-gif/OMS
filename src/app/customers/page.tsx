"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
} from "lucide-react";

const tabs = [
  { label: "一般顧客", count: 2847, value: "general" },
  { label: "卸先マスタ", count: 34, value: "wholesale" },
  { label: "ブラックリスト", count: 12, value: "blacklist" },
];

const customers = [
  { id: "C001", code: "CUS-0001", name: "山田太郎", email: "yamada@example.com", phone: "090-1234-5678", purchases: 24, total: "¥384,200", lastPurchase: "2024/04/11", registered: "2023/01/15", vip: true },
  { id: "C002", code: "CUS-0002", name: "佐藤花子", email: "sato@example.com", phone: "080-2345-6789", purchases: 8, total: "¥52,400", lastPurchase: "2024/04/10", registered: "2023/05/22", vip: false },
  { id: "C003", code: "CUS-0003", name: "田中一郎", email: "tanaka@example.com", phone: "070-3456-7890", purchases: 31, total: "¥1,245,000", lastPurchase: "2024/04/11", registered: "2022/11/03", vip: true },
  { id: "C004", code: "CUS-0004", name: "鈴木美咲", email: "suzuki@example.com", phone: "090-4567-8901", purchases: 3, total: "¥15,600", lastPurchase: "2024/04/09", registered: "2024/02/10", vip: false },
  { id: "C005", code: "CUS-0005", name: "高橋健", email: "takahashi@example.com", phone: "080-5678-9012", purchases: 15, total: "¥198,500", lastPurchase: "2024/04/08", registered: "2023/03/28", vip: true },
  { id: "C006", code: "CUS-0006", name: "渡辺京子", email: "watanabe@example.com", phone: "070-6789-0123", purchases: 5, total: "¥67,800", lastPurchase: "2024/04/07", registered: "2023/08/14", vip: false },
  { id: "C007", code: "CUS-0007", name: "伊藤大輔", email: "ito@example.com", phone: "090-7890-1234", purchases: 2, total: "¥22,400", lastPurchase: "2024/04/05", registered: "2024/01/20", vip: false },
  { id: "C008", code: "CUS-0008", name: "中村あかり", email: "nakamura@example.com", phone: "080-8901-2345", purchases: 19, total: "¥256,300", lastPurchase: "2024/04/11", registered: "2022/09/07", vip: true },
];

const recentOrders = [
  { id: "ORD-2024-00851", amount: "¥32,400", status: "新規受付", date: "04/11" },
  { id: "ORD-2024-00830", amount: "¥18,200", status: "完了", date: "04/05" },
  { id: "ORD-2024-00812", amount: "¥8,500", status: "完了", date: "03/28" },
];

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">顧客管理</h1>
        <div className="flex items-center gap-2">
          <Link href="/customers/wholesale/new" className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/60 backdrop-blur-xl border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            "text-gray-700 hover:bg-white/80 transition-all"
          )}>
            <Plus className="h-4 w-4" />
            卸先登録
          </Link>
          <Link href="/customers/new" className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
            "text-white hover:bg-blue-500/90 transition-all"
          )}>
            <Plus className="h-4 w-4" />
            顧客登録
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
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
            )}>
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
            placeholder="顧客名・メール・電話番号で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        {["購入回数", "累計金額"].map((filter) => (
          <button key={filter} className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-xl text-sm",
            "bg-white/50 backdrop-blur-xl border border-white/50",
            "text-gray-600 hover:bg-white/70 transition-all"
          )}>
            {filter}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <GlassCard className={cn("p-0 overflow-hidden transition-all duration-300", selectedCustomer ? "flex-1" : "w-full")}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客コード</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">購入回数</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">累計金額</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終購入日</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={cn(
                      "border-t border-white/30 transition-colors cursor-pointer",
                      selectedCustomer?.id === c.id ? "bg-blue-500/8" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{c.name}</span>
                        {c.vip && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700">VIP</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{c.email}</td>
                    <td className="px-3 py-3 text-gray-600">{c.phone}</td>
                    <td className="px-3 py-3 text-center font-medium text-gray-700">{c.purchases}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">{c.total}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{c.lastPurchase}</td>
                    <td className="px-3 py-3">
                      <Link href={`/customers/${c.id}/edit`} onClick={(e) => e.stopPropagation()} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end px-4 py-3 border-t border-white/40 bg-white/30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">1-8 / 2,847件</span>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400"><ChevronLeft className="h-4 w-4" /></button>
                <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Preview Panel */}
        {selectedCustomer && (
          <GlassCard className="w-80 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">顧客情報</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Name */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 font-bold text-lg">
                {selectedCustomer.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">{selectedCustomer.code} {selectedCustomer.vip && "・VIP"}</p>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Contact */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">住所未登録</span>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">購入回数</p>
                <p className="text-lg font-bold text-gray-800">{selectedCustomer.purchases}<span className="text-sm font-normal text-gray-500">回</span></p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">累計金額</p>
                <p className="text-lg font-bold text-gray-800">{selectedCustomer.total}</p>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            {/* Recent Orders */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">直近の注文</span>
              </div>
              <div className="space-y-1.5">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-white/40 text-xs">
                    <span className="text-blue-600 font-medium">{o.id}</span>
                    <span className="text-gray-700 font-medium">{o.amount}</span>
                    <span className="text-gray-400">{o.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
