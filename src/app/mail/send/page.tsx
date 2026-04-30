"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, Pause, Play, RefreshCw, Search, Send } from "lucide-react";

const queue = [
  { id: "SND-20260430-0125", trigger: "受注確認", target: "新規受付", template: "サンクスメール", count: 12, status: "送信中", progress: 8, started: "2026/04/30 10:30", finished: "—" },
  { id: "SND-20260430-0124", trigger: "発送完了", target: "出荷済み", template: "出荷通知", count: 45, status: "待機中", progress: 0, started: "—", finished: "—" },
  { id: "SND-20260430-0123", trigger: "入金確認", target: "入金完了", template: "入金確認", count: 7, status: "送信完了", progress: 7, started: "2026/04/30 09:00", finished: "2026/04/30 09:03" },
  { id: "SND-20260430-0122", trigger: "フォロー", target: "発送後3日", template: "フォローアップ", count: 23, status: "送信完了", progress: 23, started: "2026/04/30 08:00", finished: "2026/04/30 08:08" },
  { id: "SND-20260430-0121", trigger: "再発送通知", target: "再発送", template: "再発送のお知らせ", count: 3, status: "失敗", progress: 1, started: "2026/04/30 07:30", finished: "2026/04/30 07:32" },
  { id: "SND-20260429-0418", trigger: "受注確認", target: "新規受付", template: "サンクスメール", count: 88, status: "送信完了", progress: 88, started: "2026/04/29 22:00", finished: "2026/04/29 22:12" },
  { id: "SND-20260429-0417", trigger: "発送完了", target: "出荷済み", template: "出荷通知", count: 56, status: "送信完了", progress: 56, started: "2026/04/29 18:00", finished: "2026/04/29 18:08" },
];

const triggers = [
  { name: "受注確認", template: "サンクスメール", autoSend: true, delay: "受注後即時", target: 12 },
  { name: "発送完了", template: "出荷通知", autoSend: true, delay: "出荷登録後即時", target: 45 },
  { name: "入金確認", template: "入金確認", autoSend: true, delay: "入金待ち3日後", target: 7 },
  { name: "フォローアップ", template: "フォロー", autoSend: false, delay: "発送後3日後", target: 23 },
  { name: "再発送通知", template: "再発送のお知らせ", autoSend: false, delay: "手動", target: 3 },
];

const sb: Record<string, string> = {
  送信中: "bg-blue-500/15 text-blue-700",
  待機中: "bg-amber-500/15 text-amber-700",
  送信完了: "bg-emerald-500/15 text-emerald-700",
  失敗: "bg-red-500/15 text-red-700",
};

export default function MailSendPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return queue.filter((q) => {
      if (k && !`${q.id} ${q.trigger} ${q.template}`.toLowerCase().includes(k)) return false;
      if (triggerFilter !== "all" && q.trigger !== triggerFilter) return false;
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, triggerFilter, statusFilter]);

  const kpis = [
    { label: "本日送信済", value: queue.filter((q) => q.status === "送信完了" && q.started.startsWith("2026/04/30")).reduce((s, q) => s + q.progress, 0), color: "text-emerald-600", hint: "本日処理した送信完了メールの累計件数" },
    { label: "送信中", value: queue.filter((q) => q.status === "送信中").reduce((s, q) => s + q.progress, 0), color: "text-blue-600", hint: "現在送信処理中のメール件数" },
    { label: "待機中", value: queue.filter((q) => q.status === "待機中").reduce((s, q) => s + q.count, 0), color: "text-amber-600", hint: "送信予定のキュー件数" },
    { label: "本日エラー", value: queue.filter((q) => q.status === "失敗").reduce((s, q) => s + (q.count - q.progress), 0), color: "text-red-600", hint: "送信失敗で再送待ちの件数" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">メール送信処理</h1>
            <HelpHint>受注ステータス変更をトリガーにした送信バッチを管理。自動送信ジョブの監視・手動実行・失敗キューの再送が可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            送信中バッチの進捗、待機中の対象件数、失敗ジョブの再送をリアルタイムで確認できます。
          </p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("送信ジョブを再読込しました", "info")}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />再読込</span>
          </SecondaryButton>
          <PrimaryButton onClick={() => toast.show("送信バッチを手動で実行します", "success")}>
            <span className="inline-flex items-center gap-1.5"><Send className="h-4 w-4" />送信バッチ手動実行</span>
          </PrimaryButton>
        </div>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
            自動送信トリガー <HelpHint>受注ステータスの変化に応じて起動するメール送信トリガーの一覧。停止／再開はトグルで切替できます。</HelpHint>
          </h2>
          <span className="text-xs text-gray-500">{triggers.filter((t) => t.autoSend).length} / {triggers.length} 件 有効</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {triggers.map((t) => (
            <div key={t.name} className="p-3 rounded-xl bg-white/50 border border-white/60">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800 text-sm">{t.name}</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={t.autoSend} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>テンプレート: <span className="text-gray-700">{t.template}</span></div>
                <div>送信タイミング: <span className="text-gray-700">{t.delay}</span></div>
                <div>本日対象: <span className="text-gray-700 font-medium">{t.target} 件</span></div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="バッチID・トリガー・テンプレート"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">トリガー: すべて</option>
            {triggers.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">状態: すべて</option>
            <option value="送信中">送信中</option>
            <option value="待機中">待機中</option>
            <option value="送信完了">送信完了</option>
            <option value="失敗">失敗</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTriggerFilter("all"); setStatusFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {queue.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送信バッチID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">対象ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">テンプレート</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">対象件数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">進捗</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">開始</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{q.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{q.trigger}</td>
                <td className="px-4 py-3 text-gray-600">{q.target}</td>
                <td className="px-4 py-3 text-gray-600">{q.template}</td>
                <td className="px-4 py-3 text-right text-gray-800">{q.count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
                          q.status === "失敗" ? "bg-red-500/70" : q.status === "送信完了" ? "bg-emerald-500/70" : "bg-blue-500/70"
                        )}
                        style={{ width: `${q.count > 0 ? (q.progress / q.count) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{q.progress}/{q.count}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[q.status])}>
                    {q.status === "送信完了" && <CheckCircle2 className="h-3 w-3" />}
                    {q.status === "失敗" && <AlertCircle className="h-3 w-3" />}
                    {q.status === "待機中" && <Clock className="h-3 w-3" />}
                    {q.status === "送信中" && <Send className="h-3 w-3" />}
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{q.started}</td>
                <td className="px-4 py-3 text-center">
                  {q.status === "失敗" ? (
                    <button
                      onClick={() => toast.show(`${q.id} の失敗キューを再送します`, "info")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />再送
                    </button>
                  ) : q.status === "待機中" ? (
                    <button
                      onClick={() => toast.show(`${q.id} を即時実行します`, "success")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 inline-flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />実行
                    </button>
                  ) : q.status === "送信中" ? (
                    <button
                      onClick={() => toast.show(`${q.id} を一時停止しました`, "info")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 inline-flex items-center gap-1"
                    >
                      <Pause className="h-3 w-3" />停止
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.show(`${q.id} の詳細を表示します`, "info")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-700 hover:bg-gray-500/20"
                    >
                      詳細
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">該当するバッチがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
