"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
const data = [
  { order: "ORD-2024-00838", orderAmt: "¥28,500", paidAmt: "¥25,000", diff: "-¥3,500", status: "不足" },
  { order: "ORD-2024-00820", orderAmt: "¥12,400", paidAmt: "¥12,800", diff: "+¥400", status: "過剰" },
  { order: "ORD-2024-00815", orderAmt: "¥5,600", paidAmt: "¥0", diff: "-¥5,600", status: "未入金" },
];
const sb: Record<string,string> = { "不足": "bg-orange-500/15 text-orange-700", "過剰": "bg-blue-500/15 text-blue-700", "未入金": "bg-red-500/15 text-red-700" };
export default function MismatchPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">金額不整合確認</h1>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">受注金額</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">差額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{data.map(d => (
            <tr key={d.order} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-4 py-3 font-medium text-blue-600">{d.order}</td>
              <td className="px-4 py-3 text-right text-gray-700">{d.orderAmt}</td>
              <td className="px-4 py-3 text-right text-gray-700">{d.paidAmt}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-800">{d.diff}</td>
              <td className="px-4 py-3 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[d.status])}>{d.status}</span></td>
              <td className="px-4 py-3 text-center"><button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">確認</button></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
