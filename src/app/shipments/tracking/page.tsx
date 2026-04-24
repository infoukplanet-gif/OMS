"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
const data = [
  { order: "ORD-2024-00851", carrier: "ヤマト運輸", tracking: "" },
  { order: "ORD-2024-00850", carrier: "佐川急便", tracking: "" },
  { order: "ORD-2024-00849", carrier: "ヤマト運輸", tracking: "" },
  { order: "ORD-2024-00846", carrier: "日本郵便", tracking: "" },
];
export default function TrackingPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">配送番号反映</h1>
        <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all")}><Upload className="h-4 w-4" />CSV一括登録</button>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">配送方法</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">追跡番号</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
          </tr></thead>
          <tbody>{data.map(d => (
            <tr key={d.order} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-4 py-3 font-medium text-blue-600">{d.order}</td>
              <td className="px-4 py-3 text-gray-700">{d.carrier}</td>
              <td className="px-4 py-3"><input type="text" placeholder="追跡番号を入力..." className="w-full h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20" /></td>
              <td className="px-4 py-3 text-center"><button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">反映</button></td>
            </tr>
          ))}</tbody>
        </table>
      </GlassCard>
    </div>
  );
}
