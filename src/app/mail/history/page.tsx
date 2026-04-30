"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Download, Eye, RefreshCw, Search } from "lucide-react";

const data = [
  { id: "M-20260430-0125", to: "tanaka@example.com", customer: "田中 太郎", subject: "【受注確認】ORD-2026-08423", template: "受注確認", sent: "2026/04/30 10:32", status: "送信済", retry: 0, openRate: "72%", clickRate: "18%" },
  { id: "M-20260430-0124", to: "yamada@example.com", customer: "山田 花子", subject: "【発送完了】ORD-2026-08418", template: "発送通知", sent: "2026/04/30 10:18", status: "送信済", retry: 0, openRate: "85%", clickRate: "32%" },
  { id: "M-20260430-0123", to: "sato@example.com", customer: "佐藤 一郎", subject: "【入金確認】ORD-2026-08410", template: "入金確認", sent: "2026/04/30 09:55", status: "送信済", retry: 0, openRate: "60%", clickRate: "10%" },
  { id: "M-20260430-0122", to: "invalid@example", customer: "—", subject: "【受注確認】ORD-2026-08405", template: "受注確認", sent: "2026/04/30 09:40", status: "エラー", retry: 3, openRate: "—", clickRate: "—" },
  { id: "M-20260430-0121", to: "suzuki@example.com", customer: "鈴木 翼", subject: "【フォロー】ORD-2026-08400", template: "フォロー", sent: "2026/04/30 09:12", status: "送信済", retry: 0, openRate: "45%", clickRate: "8%" },
  { id: "M-20260429-0418", to: "takahashi@example.com", customer: "高橋 涼", subject: "【発送完了】ORD-2026-08395", template: "発送通知", sent: "2026/04/29 18:45", status: "送信済", retry: 0, openRate: "90%", clickRate: "28%" },
  { id: "M-20260429-0417", to: "ito@example.com", customer: "伊藤 さくら", subject: "【入金確認】ORD-2026-08390", template: "入金確認", sent: "2026/04/29 16:22", status: "送信済", retry: 0, openRate: "65%", clickRate: "12%" },
  { id: "M-20260429-0416", to: "watanabe@example.com", customer: "渡辺 健", subject: "【再発送のお知らせ】ORD-2026-08385", template: "再発送", sent: "2026/04/29 14:00", status: "送信済", retry: 0, openRate: "78%", clickRate: "20%" },
  { id: "M-20260429-0415", to: "fail@nodomain.example", customer: "—", subject: "【受注確認】ORD-2026-08382", template: "受注確認", sent: "2026/04/29 11:05", status: "エラー", retry: 3, openRate: "—", clickRate: "—" },
  { id: "M-20260429-0414", to: "kimura@example.com", customer: "木村 美咲", subject: "【サンクスメール】ORD-2026-08380", template: "サンクスメール", sent: "2026/04/29 10:00", status: "送信済", retry: 0, openRate: "82%", clickRate: "25%" },
  { id: "M-20260428-0231", to: "kobayashi@example.com", customer: "小林 大輔", subject: "【発送完了】ORD-2026-08365", template: "発送通知", sent: "2026/04/28 18:00", status: "送信済", retry: 0, openRate: "75%", clickRate: "22%" },
  { id: "M-20260428-0230", to: "yoshida@example.com", customer: "吉田 あゆみ", subject: "【入金催促】ORD-2026-08360", template: "入金催促", sent: "2026/04/28 12:00", status: "保留", retry: 1, openRate: "—", clickRate: "—" },
];

const sb: Record<string, string> = {
  送信済: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  保留: "bg-amber-500/15 text-amber-700",
};

export default function MailHistoryPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.to} ${d.subject} ${d.customer} ${d.id}`.toLowerCase().includes(k)) return false;
      if (templateFilter !== "all" && d.template !== templateFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, templateFilter, statusFilter]);

  const templates = Array.from(new Set(data.map((d) => d.template)));

  const kpis = [
    { label: "送信総数", value: data.length, hint: "選択期間内の送信履歴数", color: "text-gray-700" },
    { label: "送信成功率", value: `${Math.round((data.filter((d) => d.status === "送信済").length / data.length) * 100)}%`, hint: "送信成功したメールの割合", color: "text-emerald-600" },
    { label: "エラー件数", value: data.filter((d) => d.status === "エラー").length, hint: "宛先不明・SMTPエラー等で失敗", color: "text-red-600" },
    { label: "平均開封率", value: "73%", hint: "Webビーコンによる開封トラッキング集計", color: "text-blue-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">送信履歴</h1>
            <HelpHint>送信完了したメールの履歴一覧。本文確認・再送・CSVダウンロードが可能です。エラー時はリトライ回数・状態を確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            送信成功・失敗・保留を含む全履歴。期間とテンプレートで絞り込み、CSVに書き出せます。
          </p>
        </div>
        <SecondaryButton onClick={() => toast.show("送信履歴をCSVで書き出しました", "success")}>
          <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />CSVダウンロード</span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{k.label}</div>
              <HelpHint side="left">{k.hint}</HelpHint>
            </div>
            <div className={cn("text-2xl font-bold mt-1", k.color)}>{k.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="送信ID・宛先・件名・顧客名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="開始日" />
          <DatePicker placeholder="終了日" />
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">テンプレート: すべて</option>
            {templates.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">状態: すべて</option>
            <option value="送信済">送信済</option>
            <option value="エラー">エラー</option>
            <option value="保留">保留</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTemplateFilter("all"); setStatusFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {data.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">テンプレート</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信日時</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">再送</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">開封</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">クリック</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{d.id}</td>
                <td className="px-3 py-2.5">
                  <div className="text-gray-700">{d.to}</div>
                  <div className="text-xs text-gray-400">{d.customer}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-800">{d.subject}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.template}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.sent}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "送信済" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "エラー" && <AlertCircle className="h-3 w-3" />}
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{d.retry}</td>
                <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{d.openRate}</td>
                <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{d.clickRate}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toast.show(`${d.id} の本文を表示します`, "info")}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="本文表示"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {d.status === "エラー" && (
                      <button
                        onClick={() => toast.show(`${d.id} を再送しました`, "success")}
                        className="p-1.5 rounded-lg bg-orange-500/15 text-orange-700 hover:bg-orange-500/25"
                        title="再送"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">該当する送信履歴がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
