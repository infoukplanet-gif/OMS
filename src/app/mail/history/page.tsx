"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Download, Eye, RefreshCw, Search, XCircle } from "lucide-react";
import type { MailRecord } from "@/lib/state-machines/mail";
import { mailStore } from "@/lib/stores/mail";
import { syncMailQueueIntoStore } from "@/lib/mail/log-bridge";

const sb: Record<string, string> = {
  送信済: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  キャンセル済: "bg-gray-400/15 text-gray-500",
};

/** 状態遷移に使う現在時刻（YYYY/MM/DD HH:mm） */
function formatNow(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function downloadCsv(rows: MailRecord[]) {
  const headers = ["送信ID", "宛先", "顧客名", "件名", "種類", "送信日時", "状態", "再送回数"];
  const lines = rows.map((m) =>
    [m.id, m.to, m.customer, m.subject, m.type, m.sentAt ?? "—", m.status, String(m.retry)]
      .map((c) => `"${c.replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob(["﻿" + [headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "送信履歴.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function MailHistoryPage() {
  const toast = useToast();

  // 共有ストア購読（mail/page.tsx が永続化オーナー。ここは閲覧＋再送のみ）
  const mails = useSyncExternalStore(mailStore.subscribe, mailStore.getState, mailStore.getState);

  // セッション内 cascade enqueue 分を冪等同期（register が id 重複を弾く）
  useEffect(() => {
    syncMailQueueIntoStore();
  }, [mails]);

  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewMail, setPreviewMail] = useState<MailRecord | null>(null);

  const history = useMemo(
    () => mails.filter((m) => m.status === "送信済" || m.status === "エラー" || m.status === "キャンセル済"),
    [mails],
  );

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return history.filter((m) => {
      if (k && !`${m.to} ${m.subject} ${m.customer} ${m.id}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [history, keyword, typeFilter, statusFilter]);

  const types = Array.from(new Set(history.map((m) => m.type)));

  const sentCount = history.filter((m) => m.status === "送信済").length;
  const kpis = [
    { label: "送信総数", value: history.length, hint: "送信済・エラー・キャンセル済を含む履歴件数", color: "text-gray-700" },
    { label: "送信成功率", value: history.length > 0 ? `${Math.round((sentCount / history.length) * 100)}%` : "—", hint: "送信成功したメールの割合", color: "text-emerald-600" },
    { label: "エラー件数", value: history.filter((m) => m.status === "エラー").length, hint: "宛先不明・SMTPエラー等で失敗。再送できます", color: "text-red-600" },
    { label: "キャンセル済", value: history.filter((m) => m.status === "キャンセル済").length, hint: "送信前に手動キャンセルしたメール", color: "text-gray-500" },
  ];

  const handleResend = (m: MailRecord) => {
    if (mailStore.applyTransition(m.id, "resend", formatNow()).applied) {
      toast.show(`${m.id} を再送しました`, "success");
    } else {
      toast.show(`${m.id} は再送できません`, "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">送信履歴</h1>
            <HelpHint>送信完了したメールの履歴一覧。本文確認・再送・CSVダウンロードが可能です。エラー時はリトライ回数・状態を確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            送信成功・失敗・キャンセルを含む全履歴。メール管理ページと同じ共有データを表示しています。
          </p>
        </div>
        <SecondaryButton
          onClick={() => {
            downloadCsv(filtered);
            toast.show(`${filtered.length} 件をCSVで書き出しました`, "success");
          }}
        >
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">種類: すべて</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">状態: すべて</option>
            <option value="送信済">送信済</option>
            <option value="エラー">エラー</option>
            <option value="キャンセル済">キャンセル済</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {history.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">宛先</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">件名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">種類</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">送信日時</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">再送回数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{m.id}</td>
                <td className="px-3 py-2.5">
                  <div className="text-gray-700">{m.to}</div>
                  <div className="text-xs text-gray-400">{m.customer}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-800">{m.subject}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{m.type}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{m.sentAt ?? "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[m.status])}>
                    {m.status === "送信済" && <CheckCircle2 className="h-3 w-3" />}
                    {m.status === "エラー" && <AlertCircle className="h-3 w-3" />}
                    {m.status === "キャンセル済" && <XCircle className="h-3 w-3" />}
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{m.retry}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setPreviewMail(m)}
                      className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      title="本文表示"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {m.status === "エラー" && (
                      <button
                        onClick={() => handleResend(m)}
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
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">該当する送信履歴がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      <Modal open={previewMail !== null} onClose={() => setPreviewMail(null)} title="メール本文">
        {previewMail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[5rem_1fr] gap-y-1.5 text-xs">
              <span className="text-gray-500">送信ID</span>
              <span className="font-mono text-gray-700">{previewMail.id}</span>
              <span className="text-gray-500">宛先</span>
              <span className="text-gray-700">{previewMail.to}（{previewMail.customer}）</span>
              <span className="text-gray-500">件名</span>
              <span className="text-gray-800 font-medium">{previewMail.subject}</span>
              <span className="text-gray-500">送信日時</span>
              <span className="text-gray-700">{previewMail.sentAt ?? "—"}</span>
            </div>
            <div className="rounded-xl bg-white/70 border border-white/60 p-4 whitespace-pre-wrap text-gray-700 max-h-80 overflow-y-auto">
              {previewMail.body || "本文がありません"}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
