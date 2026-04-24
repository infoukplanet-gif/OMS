"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const jobs = [
  { name: "朝次自動引当", schedule: "毎日 09:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-14 09:00", result: "成功", count: 142 },
  { name: "昼次自動引当", schedule: "毎日 13:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-14 13:00", result: "成功", count: 58 },
  { name: "夕次自動引当", schedule: "毎日 17:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-13 17:00", result: "成功", count: 73 },
  { name: "緊急引当（予約商品）", schedule: "発売日 00:00", target: "予約商品全件", enabled: false, lastRun: "-", result: "-", count: 0 },
];

const rb: Record<string, string> = {
  成功: "bg-emerald-500/15 text-emerald-700",
  失敗: "bg-red-500/15 text-red-700",
  "-": "bg-gray-400/15 text-gray-500",
};

export default function AllocationAutoPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">引当自動実行処理</h1>
        <p className="text-sm text-gray-500 mt-1">
          定時スケジュールで受注に対する在庫引当を自動実行します。引当順序は受注日の昇順、同一受注内では優先度の高い明細から引当されます。
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">引当ルール</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="引当順序" value="受注日昇順" />
          <Field label="引当対象ステータス" value="新規受付・入金済み" />
          <Field label="部分引当許可" value="許可しない" />
          <Field label="引当失敗時の挙動" value="欠品ステータスへ移動" />
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ジョブ名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">スケジュール</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">対象</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">結果</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">引当件数</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.name} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-medium text-gray-800">{j.name}</td>
                <td className="px-4 py-3 text-gray-700">{j.schedule}</td>
                <td className="px-4 py-3 text-gray-600">{j.target}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                    j.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-400/15 text-gray-500")}>
                    {j.enabled ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{j.lastRun}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", rb[j.result])}>
                    {j.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-800">{j.count}</td>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
      />
    </div>
  );
}
