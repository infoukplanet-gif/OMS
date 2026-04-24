"use client";
import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Plus } from "lucide-react";
const tabs = [
  { label: "入金確認", value: "confirm", count: 34 },
  { label: "入金登録", value: "register" },
  { label: "一括入金処理", value: "bulk" },
];
const payments = [
  { order: "ORD-2024-00849", customer: "田中一郎", amount: "¥154,000", method: "銀行振込", status: "未入金", date: "2024/04/11" },
  { order: "ORD-2024-00844", customer: "中村あかり", amount: "¥3,200", method: "銀行振込", status: "未入金", date: "2024/04/11" },
  { order: "ORD-2024-00838", customer: "井上智", amount: "¥28,500", method: "銀行振込", status: "一部入金", date: "2024/04/10" },
  { order: "ORD-2024-00835", customer: "木下真由", amount: "¥45,000", method: "請求書払い", status: "未入金", date: "2024/04/09" },
  { order: "ORD-2024-00830", customer: "山田太郎", amount: "¥18,200", method: "銀行振込", status: "入金済", date: "2024/04/08" },
];
const sb: Record<string,string> = { "未入金": "bg-red-500/15 text-red-700", "一部入金": "bg-yellow-500/15 text-yellow-700", "入金済": "bg-emerald-500/15 text-emerald-700" };
export default function PaymentsPage() {
  const [tab, setTab] = useState("confirm");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">入金管理</h1>
        <Link href="/payments/register/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"><Plus className="h-4 w-4" />入金登録</Link>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all", tab === t.value ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium" : "text-gray-500 hover:bg-white/40")}>
            {t.label}{t.count && <span className={cn("px-1.5 py-0.5 rounded-md text-xs", tab === t.value ? "bg-blue-500/15 text-blue-700" : "bg-gray-500/10 text-gray-500")}>{t.count}</span>}
          </button>
        ))}
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客名</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">支払方法</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">入金状態</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注日</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.order} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 font-medium text-blue-600">{p.order}</td>
              <td className="px-3 py-2.5 text-gray-700">{p.customer}</td>
              <td className="px-3 py-2.5 text-right font-medium text-gray-800">{p.amount}</td>
              <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{p.method}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[p.status])}>{p.status}</span></td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{p.date}</td>
              <td className="px-3 py-2.5 text-center">{p.status !== "入金済" && <Link href="/payments/register/new" className="inline-flex px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">入金登録</Link>}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
