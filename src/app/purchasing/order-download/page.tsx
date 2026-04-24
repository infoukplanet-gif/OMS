"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { FileDown } from "lucide-react";
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">発注書ダウンロード</h1>
      <GlassCard>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">開始日</label><DatePicker /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">終了日</label><DatePicker /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">対象</label><select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50"><option>すべて</option><option>処理済</option><option>未処理</option></select></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">出力形式</label><select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50"><option>CSV</option><option>Excel</option><option>PDF</option></select></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"><FileDown className="h-4 w-4" />ダウンロード</button>
      </GlassCard>
    </div>
  );
}
