"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const channels = [
  { name: "楽天市場 受注取得API", endpoint: "/api/rakuten/orders", schedule: "15分間隔", lastRun: "2026-04-14 10:30", lastCount: 12, enabled: true },
  { name: "Yahoo!ショッピング 受注取得API", endpoint: "/api/yahoo/orders", schedule: "15分間隔", lastRun: "2026-04-14 10:30", lastCount: 5, enabled: true },
  { name: "Amazon 受注取得API", endpoint: "/api/amazon/orders", schedule: "30分間隔", lastRun: "2026-04-14 10:15", lastCount: 8, enabled: true },
  { name: "自社EC 受注取得API", endpoint: "/api/own/orders", schedule: "リアルタイム", lastRun: "2026-04-14 10:42", lastCount: 1, enabled: true },
  { name: "au PAY マーケット 受注取得API", endpoint: "/api/aupay/orders", schedule: "30分間隔", lastRun: "-", lastCount: 0, enabled: false },
];

export default function OrderFetchApiPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">受注取得API処理</h1>
        <p className="text-sm text-gray-500 mt-1">
          各モールから定期的に受注データを取得し、自社の受注伝票として取り込みます。取得タイミング・重複検出・エラー時のリトライポリシーを設定できます。
        </p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">共通設定</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="取得間隔（デフォルト）" value="15分" />
          <Field label="受注番号の重複検出" value="受注番号＋モール" />
          <Field label="エラー時のリトライ回数" value="3回" />
          <Field label="リトライ間隔" value="5分" />
          <Field label="取得失敗時の通知先" value="admin@example.com" />
          <Field label="過去何日分を取得するか" value="7日" />
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">チャネル別設定</h2>
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">API名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">エンドポイント</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">スケジュール</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">取得件数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.name} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.endpoint}</td>
                  <td className="px-4 py-3 text-gray-700">{c.schedule}</td>
                  <td className="px-4 py-3 text-gray-600">{c.lastRun}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{c.lastCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      c.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-400/15 text-gray-500")}>
                      {c.enabled ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                      設定
                    </button>
                    <button className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25">
                      手動実行
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
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
