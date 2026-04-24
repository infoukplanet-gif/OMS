"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, MapPin, Star } from "lucide-react";
const warehouses = [
  { code: "WH-001", name: "東京本社倉庫", address: "東京都品川区xxx", isDefault: true },
  { code: "WH-002", name: "大阪倉庫", address: "大阪府大阪市xxx", isDefault: false },
  { code: "WH-003", name: "福岡倉庫", address: "福岡県福岡市xxx", isDefault: false },
];
export default function WarehousesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">拠点管理</h1>
        <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />拠点追加</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {warehouses.map(w => (
          <GlassCard key={w.code} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{w.name}</h3>
                  {w.isDefault && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{w.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400" />{w.address}</div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-600 bg-white/60 border border-white/50 hover:bg-white/80 transition-colors">編集</button>
              {!w.isDefault && <button className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">デフォルトに設定</button>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
