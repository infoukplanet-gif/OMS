"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { FileText, MoreHorizontal } from "lucide-react";
const templates = [
  { name: "標準納品書", type: "納品書", lastUpdated: "2024/04/01", usage: 1245 },
  { name: "出荷指示書A", type: "出荷指示書", lastUpdated: "2024/03/28", usage: 890 },
  { name: "卸売向け納品書", type: "納品書", lastUpdated: "2024/03/15", usage: 56 },
  { name: "簡易出荷指示", type: "出荷指示書", lastUpdated: "2024/03/10", usage: 234 },
];
const typeBadge: Record<string,string> = { "納品書": "bg-blue-500/15 text-blue-700", "出荷指示書": "bg-purple-500/15 text-purple-700" };
export default function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">テンプレート設定</h1>
        <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><FileText className="h-4 w-4" />新規テンプレート</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {templates.map(t => (
          <GlassCard key={t.name} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-800">{t.name}</h3>
              <button className="p-1 rounded-lg hover:bg-white/60 text-gray-400"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={cn("px-2 py-0.5 rounded-md font-medium", typeBadge[t.type])}>{t.type}</span>
              <span>使用回数: {t.usage}回</span>
              <span>更新: {t.lastUpdated}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80">プレビュー</button>
              <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20">編集</button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
