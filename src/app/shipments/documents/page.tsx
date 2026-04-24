"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { FileDown } from "lucide-react";
export default function DocumentsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">納品書・出荷指示書ダウンロード</h1>
      <GlassCard>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">開始日</label>
            <DatePicker placeholder="開始日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">終了日</label>
            <DatePicker placeholder="終了日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">ステータス</label>
            <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"><option>出荷待ち</option><option>出荷済み</option><option>全て</option></select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">出力形式</label>
            <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"><option>PDF（個別）</option><option>PDF（一括）</option><option>CSV</option></select>
          </div>
        </div>
        <div className="flex gap-3">
          <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><FileDown className="h-4 w-4" />納品書ダウンロード</button>
          <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all")}><FileDown className="h-4 w-4" />出荷指示書ダウンロード</button>
        </div>
      </GlassCard>
    </div>
  );
}
