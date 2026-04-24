"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
const items = [
  { sku: "WEP-001-BK", name: "ワイヤレスイヤホン Pro / ブラック", system: 30, actual: "", diff: "" },
  { sku: "UCB-002", name: "USB-Cケーブル 2m", system: 8, actual: "", diff: "" },
  { sku: "MBT-004", name: "モバイルバッテリー 20000mAh", system: 2, actual: "", diff: "" },
  { sku: "CHG-007", name: "急速充電器 65W", system: 67, actual: "", diff: "" },
  { sku: "PFS-005", name: "保護フィルム セット", system: 120, actual: "", diff: "" },
];
export default function StocktakingPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">棚卸</h1>
        <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Play className="h-4 w-4" />棚卸開始</button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">システム在庫</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">実数</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">差異</th>
          </tr></thead>
          <tbody>{items.map(i => (
            <tr key={i.sku} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.sku}</td>
              <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
              <td className="px-3 py-2.5 text-center font-medium text-gray-700">{i.system}</td>
              <td className="px-3 py-2.5 text-center"><input type="number" className="h-7 w-20 px-2 rounded-lg text-xs text-center bg-white/50 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20" placeholder="入力" /></td>
              <td className="px-3 py-2.5 text-center text-gray-400">-</td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
