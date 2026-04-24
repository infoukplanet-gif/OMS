"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Search, HelpCircle } from "lucide-react";

const inv = [
  { sku: "WEP-001-BK", name: "ワイヤレスイヤホン Pro / ブラック", stock: 30, allocated: 5, free: 25, constant: 10, reorder: 15, lot: 10, status: "適正" },
  { sku: "WEP-001-WH", name: "ワイヤレスイヤホン Pro / ホワイト", stock: 15, allocated: 3, free: 12, constant: 10, reorder: 15, lot: 10, status: "適正" },
  { sku: "UCB-002", name: "USB-Cケーブル 2m", stock: 8, allocated: 2, free: 6, constant: 20, reorder: 25, lot: 50, status: "発注対象" },
  { sku: "MBT-004", name: "モバイルバッテリー 20000mAh", stock: 2, allocated: 1, free: 1, constant: 15, reorder: 20, lot: 30, status: "発注対象" },
  { sku: "TWS-006-BK", name: "完全ワイヤレスイヤホン / ブラック", stock: 0, allocated: 0, free: 0, constant: 10, reorder: 10, lot: 20, status: "在庫切れ" },
  { sku: "CHG-007", name: "急速充電器 65W", stock: 67, allocated: 8, free: 59, constant: 30, reorder: 40, lot: 50, status: "適正" },
];

const sb: Record<string, string> = {
  "適正": "bg-emerald-500/15 text-emerald-700",
  "発注対象": "bg-yellow-500/15 text-yellow-700",
  "在庫切れ": "bg-red-500/15 text-red-700",
};

const Tooltip = ({ text }: { text: string }) => (
  <span className="group relative inline-flex">
    <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{text}</span>
  </span>
);

export default function InventoryPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">在庫管理</h1>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">在庫調整</button>
      </div>

      {/* 用語説明 */}
      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <p className="text-sm font-medium text-gray-800 mb-2">在庫項目の説明</p>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div><span className="font-medium text-blue-700">在庫数</span>: 倉庫に実際に存在する総数</div>
          <div><span className="font-medium text-blue-700">引当数</span>: 未出荷の受注に割り当て済の数</div>
          <div><span className="font-medium text-blue-700">フリー在庫数</span> = 在庫数 − 引当数（販売可能数。各モール・カートに連携されます）</div>
        </div>
      </GlassCard>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="SKU・商品名で検索..." className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">在庫数</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">引当数</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">
              <div className="inline-flex items-center gap-1">フリー在庫数 <Tooltip text="在庫数 − 引当数" /></div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">
              <div className="inline-flex items-center gap-1">在庫定数 <Tooltip text="常に保持しておきたい在庫数" /></div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">
              <div className="inline-flex items-center gap-1">発注点 <Tooltip text="この値を下回ると発注計算対象に" /></div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">
              <div className="inline-flex items-center gap-1">発注ロット <Tooltip text="発注時の最小単位" /></div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
          </tr></thead>
          <tbody>{inv.map(i => (
            <tr key={i.sku} className="border-t border-white/30 hover:bg-white/40 transition-colors">
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.sku}</td>
              <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
              <td className="px-3 py-2.5 text-center font-medium text-gray-700">{i.stock}</td>
              <td className="px-3 py-2.5 text-center text-gray-500">{i.allocated}</td>
              <td className="px-3 py-2.5 text-center font-bold text-gray-800">{i.free}</td>
              <td className="px-3 py-2.5 text-center text-gray-500">{i.constant}</td>
              <td className="px-3 py-2.5 text-center text-gray-500">{i.reorder}</td>
              <td className="px-3 py-2.5 text-center text-gray-500">{i.lot}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[i.status])}>{i.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
