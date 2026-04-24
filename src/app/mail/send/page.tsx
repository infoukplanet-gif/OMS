"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const queue = [
  { id: "SND-20260414-0125", trigger: "受注確認", target: "新規受付", count: 12, status: "送信中", progress: 8 },
  { id: "SND-20260414-0124", trigger: "発送完了", target: "出荷済み", count: 45, status: "待機中", progress: 0 },
  { id: "SND-20260414-0123", trigger: "入金確認", target: "入金完了", count: 7, status: "送信完了", progress: 7 },
  { id: "SND-20260414-0122", trigger: "フォロー", target: "発送後3日", count: 23, status: "送信完了", progress: 23 },
];

const sb: Record<string, string> = {
  送信中: "bg-blue-500/15 text-blue-700",
  待機中: "bg-amber-500/15 text-amber-700",
  送信完了: "bg-emerald-500/15 text-emerald-700",
  失敗: "bg-red-500/15 text-red-700",
};

export default function MailSendPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">メール送信処理</h1>
          <p className="text-sm text-gray-500 mt-1">
            受注ステータス変更をトリガーとしたメール送信バッチを管理します。送信対象の選定・件数確認・手動実行が可能です。
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          送信バッチ手動実行
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "本日送信済み", value: "238", color: "text-emerald-600" },
          { label: "送信中", value: "8", color: "text-blue-600" },
          { label: "待機中", value: "45", color: "text-amber-600" },
          { label: "本日エラー", value: "2", color: "text-red-600" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送信バッチID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">対象ステータス</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">対象件数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">進捗</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((q) => (
              <tr key={q.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 text-xs text-gray-500">{q.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{q.trigger}</td>
                <td className="px-4 py-3 text-gray-600">{q.target}</td>
                <td className="px-4 py-3 text-right text-gray-800">{q.count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className="h-full bg-blue-500/70"
                        style={{ width: `${(q.progress / q.count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{q.progress}/{q.count}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[q.status])}>
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    詳細
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
