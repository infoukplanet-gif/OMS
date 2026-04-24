"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const data = [
  { id: "Q-20260414-0042", to: "tanaka@example.com", subject: "【発送完了】ORD-2024-00842", template: "発送通知", scheduled: "2026-04-14 15:00", priority: "通常" },
  { id: "Q-20260414-0041", to: "yamada@example.com", subject: "【フォロー】ORD-2024-00828", template: "フォロー", scheduled: "2026-04-14 18:00", priority: "通常" },
  { id: "Q-20260414-0040", to: "sato@example.com", subject: "【受注確認】ORD-2024-00841", template: "受注確認", scheduled: "2026-04-14 10:45", priority: "高" },
  { id: "Q-20260414-0039", to: "kimura@example.com", subject: "【入金確認】ORD-2024-00840", template: "入金確認", scheduled: "2026-04-14 11:00", priority: "通常" },
];

const pb: Record<string, string> = {
  高: "bg-red-500/15 text-red-700",
  通常: "bg-gray-500/15 text-gray-700",
  低: "bg-gray-500/10 text-gray-500",
};

export default function MailPendingPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">送信待ち</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90">
            選択を送信キャンセル
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
            選択を即時送信
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "送信待ち件数", value: "42" },
          { label: "本日送信予定", value: "18" },
          { label: "高優先度", value: "3" },
          { label: "保留中", value: "2" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{s.value}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                <input type="checkbox" className="accent-blue-500" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">キューID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">テンプレート</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">優先度</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3"><input type="checkbox" className="accent-blue-500" /></td>
                <td className="px-4 py-3 text-xs text-gray-500">{d.id}</td>
                <td className="px-4 py-3 text-gray-700">{d.to}</td>
                <td className="px-4 py-3 text-gray-800">{d.subject}</td>
                <td className="px-4 py-3 text-gray-600">{d.template}</td>
                <td className="px-4 py-3 text-gray-600">{d.scheduled}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", pb[d.priority])}>
                    {d.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                    編集
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
