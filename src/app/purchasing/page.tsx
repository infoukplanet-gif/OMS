"use client";
import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
const tabs = [
  { label: "発注伝票", value: "orders", count: 24 },
  { label: "仕入伝票", value: "purchase", count: 18 },
];
const sb: Record<string,string> = { "発注中": "bg-blue-500/15 text-blue-700", "入荷済": "bg-emerald-500/15 text-emerald-700", "一部入荷": "bg-yellow-500/15 text-yellow-700", "キャンセル": "bg-red-500/15 text-red-700" };
const orders = [
  { id: "PO-2024-0045", supplier: "株式会社ABC電子", items: 5, amount: "¥245,000", status: "発注中", date: "2024/04/11" },
  { id: "PO-2024-0044", supplier: "グローバルパーツ合同", items: 3, amount: "¥128,000", status: "一部入荷", date: "2024/04/09" },
  { id: "PO-2024-0043", supplier: "株式会社ケーブルワークス", items: 8, amount: "¥56,000", status: "入荷済", date: "2024/04/07" },
  { id: "PO-2024-0042", supplier: "株式会社ABC電子", items: 2, amount: "¥89,000", status: "入荷済", date: "2024/04/05" },
  { id: "PO-2024-0041", supplier: "アジアサプライ株式会社", items: 10, amount: "¥342,000", status: "キャンセル", date: "2024/04/03" },
];
export default function PurchasingPage() {
  const [tab, setTab] = useState("orders");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">発注・仕入管理</h1>
        <Link href="/purchasing/new" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />新規発注</Link>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all", tab === t.value ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium" : "text-gray-500 hover:bg-white/40")}>
            {t.label}<span className={cn("px-1.5 py-0.5 rounded-md text-xs", tab === t.value ? "bg-blue-500/15 text-blue-700" : "bg-gray-500/10 text-gray-500")}>{t.count}</span>
          </button>
        ))}
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">商品数</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">合計金額</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ステータス</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注日</th>
            <th className="w-10 px-3 py-3" />
          </tr></thead>
          <tbody>{orders.map(o => (
            <tr key={o.id} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 font-medium text-blue-600">{o.id}</td>
              <td className="px-3 py-2.5 text-gray-700">{o.supplier}</td>
              <td className="px-3 py-2.5 text-center text-gray-600">{o.items}</td>
              <td className="px-3 py-2.5 text-right font-medium text-gray-800">{o.amount}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[o.status])}>{o.status}</span></td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{o.date}</td>
              <td className="px-3 py-2.5"><Link href={`/purchasing/${o.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集"><MoreHorizontal className="h-4 w-4" /></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
