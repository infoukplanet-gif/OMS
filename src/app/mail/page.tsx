"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus } from "lucide-react";
const tabs = [
  { label: "送信待ち", value: "pending", count: 8 },
  { label: "送信履歴", value: "history", count: 1245 },
  { label: "テンプレート", value: "templates" },
];
const pending = [
  { to: "yamada@example.com", subject: "ご注文ありがとうございます", type: "サンクスメール", scheduled: "2024/04/12 10:00" },
  { to: "sato@example.com", subject: "出荷完了のお知らせ", type: "出荷通知", scheduled: "2024/04/12 10:00" },
  { to: "tanaka@example.com", subject: "入金確認のお願い", type: "入金確認", scheduled: "2024/04/12 11:00" },
];
const history = [
  { to: "takahashi@example.com", subject: "ご注文ありがとうございます", type: "サンクスメール", sent: "2024/04/11 15:30", status: "送信済" },
  { to: "watanabe@example.com", subject: "出荷完了のお知らせ", type: "出荷通知", sent: "2024/04/11 14:00", status: "送信済" },
  { to: "ito@example.com", subject: "入金確認のお願い", type: "入金確認", sent: "2024/04/11 12:00", status: "エラー" },
];
const templates = [
  { name: "サンクスメール", type: "自動送信", updated: "2024/04/01" },
  { name: "出荷通知メール", type: "自動送信", updated: "2024/03/28" },
  { name: "入金確認メール", type: "自動送信", updated: "2024/03/25" },
  { name: "フォローアップ", type: "手動", updated: "2024/03/20" },
];
const typeBadge: Record<string,string> = { "サンクスメール": "bg-blue-500/15 text-blue-700", "出荷通知": "bg-emerald-500/15 text-emerald-700", "入金確認": "bg-orange-500/15 text-orange-700" };
export default function MailPage() {
  const [tab, setTab] = useState("pending");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">メール管理</h1>
        <button className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all")}><Plus className="h-4 w-4" />フリーメール送信</button>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all", tab === t.value ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium" : "text-gray-500 hover:bg-white/40")}>
            {t.label}{t.count && <span className={cn("px-1.5 py-0.5 rounded-md text-xs", tab === t.value ? "bg-blue-500/15 text-blue-700" : "bg-gray-500/10 text-gray-500")}>{t.count}</span>}
          </button>
        ))}
      </div>
      {tab === "pending" && (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種類</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信予定</th>
          </tr></thead><tbody>{pending.map((m,i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 text-gray-700">{m.to}</td>
              <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] || "bg-gray-500/15 text-gray-600")}>{m.type}</span></td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{m.scheduled}</td>
            </tr>
          ))}</tbody></table>
        </GlassCard>
      )}
      {tab === "history" && (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-white/50 border-b border-white/40">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種類</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信日時</th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
          </tr></thead><tbody>{history.map((m,i) => (
            <tr key={i} className="border-t border-white/30 hover:bg-white/40">
              <td className="px-3 py-2.5 text-gray-700">{m.to}</td>
              <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeBadge[m.type] || "bg-gray-500/15 text-gray-600")}>{m.type}</span></td>
              <td className="px-3 py-2.5 text-gray-500 text-xs">{m.sent}</td>
              <td className="px-3 py-2.5 text-center"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", m.status === "送信済" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700")}>{m.status}</span></td>
            </tr>
          ))}</tbody></table>
        </GlassCard>
      )}
      {tab === "templates" && (
        <div className="grid grid-cols-2 gap-4">
          {templates.map(t => (
            <GlassCard key={t.name} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">{t.name}</h3>
                <button className="p-1 rounded-lg hover:bg-white/60 text-gray-400"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded-md bg-gray-500/10">{t.type}</span>
                <span>更新: {t.updated}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
