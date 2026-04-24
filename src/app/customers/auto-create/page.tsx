"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const rules = [
  { name: "楽天→顧客マスタ自動作成", source: "楽天市場", enabled: true, lastRun: "2026-04-14 09:00", count: 28 },
  { name: "Yahoo→顧客マスタ自動作成", source: "Yahoo!ショッピング", enabled: true, lastRun: "2026-04-14 09:00", count: 11 },
  { name: "Amazon→顧客マスタ自動作成", source: "Amazon", enabled: true, lastRun: "2026-04-14 09:00", count: 7 },
  { name: "自社EC→顧客マスタ自動作成", source: "自社EC", enabled: true, lastRun: "2026-04-14 09:00", count: 15 },
];

export default function CustomerAutoCreatePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">顧客マスタ自動作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          受注取込時に未登録顧客を検出したら、受注情報から自動的に顧客マスタを作成します。同一顧客の判定はメール・電話番号・氏名の組合せで行います。
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">重複判定ルール</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            メールアドレスが同一なら既存顧客と判定
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            電話番号が同一なら既存顧客と判定
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" className="accent-blue-500 w-4 h-4" />
            氏名＋住所で判定
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
            判定結果をログ出力する
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
