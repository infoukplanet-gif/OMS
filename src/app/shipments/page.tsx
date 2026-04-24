"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileDown,
  FileText,
  CheckSquare,
} from "lucide-react";

const statusTabs = [
  { label: "出荷待ち", count: 23, value: "pending" },
  { label: "出荷済み", count: 156, value: "shipped" },
  { label: "配送中", count: 42, value: "in_transit" },
  { label: "配達完了", count: 1089, value: "delivered" },
];

const statusBadge: Record<string, string> = {
  "出荷待ち": "bg-orange-500/15 text-orange-700",
  "出荷済み": "bg-blue-500/15 text-blue-700",
  "配送中": "bg-purple-500/15 text-purple-700",
  "配達完了": "bg-emerald-500/15 text-emerald-700",
};

const carrierIcon: Record<string, { color: string; label: string }> = {
  "ヤマト運輸": { color: "bg-green-500", label: "ヤ" },
  "佐川急便": { color: "bg-blue-600", label: "佐" },
  "日本郵便": { color: "bg-red-500", label: "郵" },
  "西濃運輸": { color: "bg-amber-500", label: "西" },
  "福山通運": { color: "bg-indigo-500", label: "福" },
};

const shipments = [
  { id: "ORD-2024-00851", customer: "山田太郎", items: 3, amount: "¥32,400", carrier: "ヤマト運輸", tracking: "", shipDate: "2024/04/12", status: "出荷待ち" },
  { id: "ORD-2024-00850", customer: "佐藤花子", items: 1, amount: "¥8,900", carrier: "佐川急便", tracking: "", shipDate: "2024/04/12", status: "出荷待ち" },
  { id: "ORD-2024-00849", customer: "田中一郎", items: 5, amount: "¥154,000", carrier: "ヤマト運輸", tracking: "", shipDate: "2024/04/12", status: "出荷待ち" },
  { id: "ORD-2024-00845", customer: "伊藤大輔", items: 2, amount: "¥18,600", carrier: "日本郵便", tracking: "JP1234567890", shipDate: "2024/04/11", status: "出荷済み" },
  { id: "ORD-2024-00844", customer: "中村あかり", items: 1, amount: "¥3,200", carrier: "ヤマト運輸", tracking: "3456-7890-1234", shipDate: "2024/04/11", status: "配送中" },
  { id: "ORD-2024-00843", customer: "小林修", items: 3, amount: "¥67,500", carrier: "佐川急便", tracking: "5678-9012-3456", shipDate: "2024/04/10", status: "配送中" },
  { id: "ORD-2024-00840", customer: "松本愛", items: 2, amount: "¥15,800", carrier: "ヤマト運輸", tracking: "7890-1234-5678", shipDate: "2024/04/10", status: "配達完了" },
  { id: "ORD-2024-00839", customer: "木村拓也", items: 1, amount: "¥4,200", carrier: "日本郵便", tracking: "JP9876543210", shipDate: "2024/04/09", status: "配達完了" },
];

export default function ShipmentsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(selected.length === shipments.length ? [] : shipments.map((s) => s.id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">出荷管理</h1>
        <div className="flex items-center gap-2">
          <button className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/60 backdrop-blur-xl border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            "text-gray-700 hover:bg-white/80 transition-all"
          )}>
            <FileText className="h-4 w-4" />
            出荷指示書
          </button>
          <button className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/60 backdrop-blur-xl border border-white/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
            "text-gray-700 hover:bg-white/80 transition-all"
          )}>
            <FileDown className="h-4 w-4" />
            納品書
          </button>
          <button className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
            "text-white hover:bg-blue-500/90 transition-all"
          )}>
            <CheckSquare className="h-4 w-4" />
            一括出荷確定
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
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
            placeholder="受注番号・顧客名で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm",
              "bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        {["配送方法", "出荷予定日"].map((filter) => (
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

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={selected.length === shipments.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">配送方法</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">追跡番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出荷予定日</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const c = carrierIcon[s.carrier];
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(s.id) ? "bg-blue-500/5" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3 font-medium text-blue-600 cursor-pointer hover:underline">{s.id}</td>
                    <td className="px-3 py-3 text-gray-700">{s.customer}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.items}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">{s.amount}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn("h-5 w-5 rounded text-[10px] font-bold text-white flex items-center justify-center", c.color)}>
                          {c.label}
                        </span>
                        <span className="text-gray-600 text-xs">{s.carrier}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {s.tracking ? (
                        <span className="font-mono text-xs text-gray-600">{s.tracking}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="番号を入力..."
                          className={cn(
                            "w-full h-7 px-2 rounded-lg text-xs",
                            "bg-white/50 border border-white/50",
                            "placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          )}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.shipDate}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/orders/${s.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="詳細">
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
                  出荷確定
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors">
                  配送番号一括登録
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">
                  出荷指示書
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1-8 / 23件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400">
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
