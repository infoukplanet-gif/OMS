"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const data = [
  { id: "M-20260414-0012", to: "tanaka@example.com", subject: "【受注確認】ORD-2024-00842", template: "受注確認", sent: "2026-04-14 10:32", status: "送信完了" },
  { id: "M-20260414-0011", to: "yamada@example.com", subject: "【発送完了】ORD-2024-00838", template: "発送通知", sent: "2026-04-14 10:18", status: "送信完了" },
  { id: "M-20260414-0010", to: "sato@example.com", subject: "【入金確認】ORD-2024-00836", template: "入金確認", sent: "2026-04-14 09:55", status: "送信完了" },
  { id: "M-20260414-0009", to: "invalid@example", subject: "【受注確認】ORD-2024-00835", template: "受注確認", sent: "2026-04-14 09:40", status: "エラー" },
  { id: "M-20260414-0008", to: "suzuki@example.com", subject: "【フォロー】ORD-2024-00828", template: "フォロー", sent: "2026-04-14 09:12", status: "送信完了" },
  { id: "M-20260413-0201", to: "takahashi@example.com", subject: "【発送完了】ORD-2024-00820", template: "発送通知", sent: "2026-04-13 18:45", status: "送信完了" },
];

const sb: Record<string, string> = {
  送信完了: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  保留: "bg-amber-500/15 text-amber-700",
};

export default function MailHistoryPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">送信履歴</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="宛先・件名で検索"
            className="px-4 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 w-64"
          />
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90">
            CSVダウンロード
          </button>
        </div>
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送信ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">テンプレート</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送信日時</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 text-xs text-gray-500">{d.id}</td>
                <td className="px-4 py-3 text-gray-700">{d.to}</td>
                <td className="px-4 py-3 text-gray-800">{d.subject}</td>
                <td className="px-4 py-3 text-gray-600">{d.template}</td>
                <td className="px-4 py-3 text-gray-600">{d.sent}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[d.status])}>
                    {d.status}
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
