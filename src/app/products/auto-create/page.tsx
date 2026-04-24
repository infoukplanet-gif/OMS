"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const rules = [
  { name: "楽天→商品マスタ自動作成", source: "楽天市場", enabled: true, lastRun: "2026-04-14 09:00", count: 12 },
  { name: "Yahoo→商品マスタ自動作成", source: "Yahoo!ショッピング", enabled: true, lastRun: "2026-04-14 09:00", count: 5 },
  { name: "Amazon→商品マスタ自動作成", source: "Amazon", enabled: false, lastRun: "2026-04-10 09:00", count: 0 },
  { name: "自社EC→商品マスタ自動作成", source: "自社EC", enabled: true, lastRun: "2026-04-14 09:00", count: 3 },
];

export default function ProductAutoCreatePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">商品情報自動作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          受注取込時に未登録の商品を検出したら、モール情報から自動的に商品マスタを作成します。
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">グローバル設定</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            未登録商品を自動検出する
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            商品画像を自動ダウンロードする
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" className="accent-blue-500 w-4 h-4" />
            作成時に管理者へ通知メール送信
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            既存コードと衝突する場合はスキップ
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ルール名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">取得元</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">作成件数</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.name} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-3 text-gray-700">{r.source}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                    r.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-400/15 text-gray-500")}>
                    {r.enabled ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.lastRun}</td>
                <td className="px-4 py-3 text-right text-gray-800">{r.count}</td>
                <td className="px-4 py-3 text-center">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    設定
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
