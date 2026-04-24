"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
const history = [
  { date: "2024/04/11 15:30", sku: "WEP-001-BK", type: "出庫", qty: -2, ref: "ORD-2024-00851", by: "システム" },
  { date: "2024/04/11 14:00", sku: "UCB-002", type: "出庫", qty: -3, ref: "ORD-2024-00851", by: "システム" },
  { date: "2024/04/11 10:00", sku: "MBT-004", type: "入庫", qty: 50, ref: "PO-2024-0044", by: "田中" },
  { date: "2024/04/10 16:00", sku: "CHG-007", type: "調整", qty: -3, ref: "棚卸差異", by: "佐藤" },
  { date: "2024/04/10 09:00", sku: "PFS-005", type: "入庫", qty: 100, ref: "PO-2024-0043", by: "システム" },
];
const tb: Record<string,string> = { "入庫": "bg-emerald-500/15 text-emerald-700", "出庫": "bg-blue-500/15 text-blue-700", "調整": "bg-orange-500/15 text-orange-700" };
export default function InventoryHistoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">在庫変動履歴</h1>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">日時</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種別</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">数量</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">参照元</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当者</th>
          </tr></thead>
          <tbody>{history.map((h,i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 text-gray-500 text-xs">{h.date}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{h.sku}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", tb[h.type])}>{h.type}</span></td>
              <td className="px-3 py-2.5 text-center font-medium">{h.qty > 0 ? <span className="text-emerald-600">+{h.qty}</span> : <span className="text-red-600">{h.qty}</span>}</td>
              <td className="px-3 py-2.5 text-gray-700 text-xs">{h.ref}</td>
              <td className="px-3 py-2.5 text-gray-600">{h.by}</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
