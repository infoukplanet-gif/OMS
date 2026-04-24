"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";
const returns = [
  { id: "RET-001", order: "ORD-2024-00820", customer: "渡辺京子", product: "ワイヤレスイヤホン Pro", reason: "初期不良", status: "処理中" },
  { id: "RET-002", order: "ORD-2024-00815", customer: "松本愛", product: "USB-Cケーブル 2m", reason: "誤配送", status: "返金済" },
  { id: "RET-003", order: "ORD-2024-00810", customer: "木村拓也", product: "モバイルバッテリー", reason: "顧客都合", status: "受付済" },
];
const sb: Record<string,string> = { "受付済": "bg-blue-500/15 text-blue-700", "処理中": "bg-yellow-500/15 text-yellow-700", "返金済": "bg-emerald-500/15 text-emerald-700" };
export default function ReturnsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">返品伝票管理</h1>
        <Link href="/purchasing/returns/new" className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />返品登録</Link>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">返品番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客名</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ステータス</th>
            <th className="w-10 px-3 py-3" />
          </tr></thead>
          <tbody>{returns.map(r => (
            <tr key={r.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
              <td className="px-3 py-2.5 font-medium text-gray-800">{r.id}</td>
              <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
              <td className="px-3 py-2.5 text-gray-700">{r.customer}</td>
              <td className="px-3 py-2.5 text-gray-700">{r.product}</td>
              <td className="px-3 py-2.5 text-gray-600">{r.reason}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[r.status])}>{r.status}</span></td>
              <td className="px-3 py-2.5"><Link href={`/purchasing/returns/${r.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集"><Pencil className="h-3.5 w-3.5" /></Link></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
