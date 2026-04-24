"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { Upload } from "lucide-react";
export default function Page() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">仕入先マスタ一括登録</h1>
      <GlassCard>
        <div className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed border-gray-300/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-base font-medium text-gray-700">CSVファイルをドラッグ＆ドロップ</p>
          <button className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">ファイルを選択</button>
        </div>
      </GlassCard>
    </div>
  );
}
