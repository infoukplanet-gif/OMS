"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
const data = [
  { order: "ORD-2024-00849", product: "スマートウォッチバンド", sku: "SWB-003", reason: "在庫切れ", status: "保留中" },
  { order: "ORD-2024-00846", product: "完全ワイヤレスイヤホン", sku: "TWS-006-BK", reason: "在庫切れ", status: "代替提案中" },
  { order: "ORD-2024-00840", product: "モバイルバッテリー", sku: "MBT-004", reason: "不良品", status: "交換手配中" },
];
const sb: Record<string,string> = { "保留中": "bg-yellow-500/15 text-yellow-700", "代替提案中": "bg-blue-500/15 text-blue-700", "交換手配中": "bg-purple-500/15 text-purple-700" };
export default function ShortagePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">欠品・不良欠品処理</h1>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ステータス</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{data.map((d,i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 font-medium text-blue-600">{d.order}</td>
              <td className="px-3 py-2.5 text-gray-800">{d.product}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.sku}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.reason}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[d.status])}>{d.status}</span></td>
              <td className="px-3 py-2.5 text-center"><div className="flex justify-center gap-1">
                <button className="px-2 py-1 rounded text-[10px] bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25">保留</button>
                <button className="px-2 py-1 rounded text-[10px] bg-red-500/15 text-red-700 hover:bg-red-500/25">キャンセル</button>
                <button className="px-2 py-1 rounded text-[10px] bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">代替</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
