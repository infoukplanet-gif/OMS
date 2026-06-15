"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, Download, RefreshCw, Search, Trash2 } from "lucide-react";

type Job = {
  id: string;
  category: string;
  filename: string;
  range: string;
  user: string;
  format: string;
  records: number;
  size: string;
  startedAt: string;
  duration: string;
  status: "success" | "running" | "failed" | "expired";
};

const data: Job[] = [
  { id: "DL-20260430-0042", category: "売上明細", filename: "sales_2026-04.xlsx", range: "2026/04/01-2026/04/30", user: "山田", format: "Excel (xlsx)", records: 8423, size: "3.2 MB", startedAt: "2026/04/30 10:32", duration: "12s", status: "success" },
  { id: "DL-20260430-0041", category: "受注情報", filename: "orders_2026-04-29.csv", range: "2026/04/29", user: "佐藤", format: "CSV", records: 245, size: "180 KB", startedAt: "2026/04/30 09:18", duration: "3s", status: "success" },
  { id: "DL-20260430-0040", category: "在庫推移", filename: "inventory_2026-04.csv", range: "2026/04/01-2026/04/30", user: "system", format: "CSV", records: 28430, size: "8.5 MB", startedAt: "2026/04/30 02:00", duration: "48s", status: "success" },
  { id: "DL-20260429-0418", category: "顧客別購入分析", filename: "customers_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "田中", format: "Excel (xlsx)", records: 4520, size: "2.1 MB", startedAt: "2026/04/29 18:00", duration: "8s", status: "success" },
  { id: "DL-20260429-0417", category: "ABC分析", filename: "abc_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "鈴木", format: "Excel (xlsx)", records: 320, size: "120 KB", startedAt: "2026/04/29 15:40", duration: "2s", status: "success" },
  { id: "DL-20260429-0416", category: "売上明細", filename: "sales_2026-04-15-29.csv", range: "2026/04/15-2026/04/29", user: "山田", format: "CSV", records: 1245, size: "640 KB", startedAt: "2026/04/29 11:22", duration: "—", status: "running" },
  { id: "DL-20260429-0415", category: "顧客別購入分析", filename: "customers_2026-04.csv", range: "2026/04/01-2026/04/29", user: "system", format: "CSV", records: 0, size: "—", startedAt: "2026/04/29 08:00", duration: "60s", status: "failed" },
  { id: "DL-20260420-0123", category: "返品集計", filename: "returns_2026-Q1.xlsx", range: "2026/01/01-2026/03/31", user: "高橋", format: "Excel (xlsx)", records: 88, size: "32 KB", startedAt: "2026/04/20 14:00", duration: "1s", status: "expired" },
];

const sb: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700",
  running: "bg-blue-500/15 text-blue-700",
  failed: "bg-red-500/15 text-red-700",
  expired: "bg-gray-500/15 text-gray-500",
};
const sbLabel: Record<string, string> = { success: "成功", running: "処理中", failed: "失敗", expired: "期限切れ" };

const categories = Array.from(new Set(data.map((d) => d.category)));

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DownloadHistoryPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>(data);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | Job["status"]>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const fmt = (dt: Date) => `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
    const from = fromDate ? fmt(fromDate) : null;
    const to = toDate ? fmt(toDate) : null;
    return jobs.filter((d) => {
      if (k && !`${d.id} ${d.filename} ${d.user}`.toLowerCase().includes(k)) return false;
      if (category !== "all" && d.category !== category) return false;
      if (status !== "all" && d.status !== status) return false;
      const day = d.startedAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [jobs, keyword, category, status, fromDate, toDate]);

  const kpis = [
    { label: "総ダウンロード", value: jobs.length, color: "text-gray-700" },
    { label: "成功", value: jobs.filter((d) => d.status === "success").length, color: "text-emerald-600" },
    { label: "処理中", value: jobs.filter((d) => d.status === "running").length, color: "text-blue-600" },
    { label: "失敗（要再実行）", value: jobs.filter((d) => d.status === "failed").length, color: "text-red-600" },
  ];

  const exportHistoryCsv = () => {
    const header = ["ジョブID", "カテゴリ", "ファイル名", "期間", "実行者", "形式", "レコード", "サイズ", "実行日時", "所要", "状態"];
    const rows = filtered.map((d) => [d.id, d.category, d.filename, d.range, d.user, d.format, d.records, d.size, d.startedAt, d.duration, sbLabel[d.status]]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadBlob(`download_history_${filtered.length}件.csv`, "﻿" + csv, "text/csv;charset=utf-8");
    toast.show(`履歴 ${filtered.length} 件をCSVで書き出しました`, "success");
  };

  const reDownload = (job: Job) => {
    const header = ["ジョブID", "カテゴリ", "ファイル名", "期間", "実行者", "形式", "レコード", "サイズ", "実行日時"];
    const row = [job.id, job.category, job.filename, job.range, job.user, job.format, job.records, job.size, job.startedAt];
    const csv = [header, row].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadBlob(job.filename.replace(/\.(xlsx|csv)$/i, "") + ".csv", "﻿" + csv, "text/csv;charset=utf-8");
    toast.show(`${job.filename} を再ダウンロードしました`, "info");
  };

  const reRun = (id: string) => {
    setJobs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "running", duration: "—" } : d)));
    toast.show(`${id} を再実行しています…`, "info");
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((d) =>
          d.id === id && d.status === "running"
            ? { ...d, status: "success", duration: "4s", records: d.records || 1 }
            : d
        )
      );
      toast.show(`${id} の再実行が完了しました`, "success");
    }, 1600);
  };

  const removeJob = (id: string) => {
    setJobs((prev) => prev.filter((d) => d.id !== id));
    toast.show(`${id} を削除しました`, "info");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">ダウンロード履歴</h1>
            <HelpHint>分析・受注・在庫など各種CSV/Excelダウンロードの履歴を一覧表示します。失敗時の再実行・成功ファイルの再ダウンロードが可能です。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">過去のダウンロードジョブを統合管理。期限切れファイルは7日経過で自動削除されます。</p>
        </div>
        <SecondaryButton onClick={exportHistoryCsv}>
          <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />履歴CSV</span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="text-xs text-gray-500">{k.label}</div>
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
              placeholder="ジョブID・ファイル名・実行者"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="開始日" value={fromDate} onChange={setFromDate} />
          <DatePicker placeholder="終了日" value={toDate} onChange={setToDate} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="success">成功</option>
            <option value="running">処理中</option>
            <option value="failed">失敗</option>
            <option value="expired">期限切れ</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setCategory("all"); setStatus("all"); setFromDate(undefined); setToDate(undefined); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {data.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ジョブID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">カテゴリ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ファイル名 / 期間</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">実行者</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">形式</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">レコード</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">サイズ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">実行日時</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">所要</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{d.id}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.category}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800 text-xs">{d.filename}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{d.range}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{d.user}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{d.format}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.records.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-600 text-xs">{d.size}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{d.startedAt}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500 text-xs">{d.duration}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "success" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "running" && <Clock className="h-3 w-3" />}
                    {d.status === "failed" && <AlertCircle className="h-3 w-3" />}
                    {sbLabel[d.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {d.status === "success" && (
                      <button onClick={() => reDownload(d)} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="再ダウンロード">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {d.status === "failed" && (
                      <button onClick={() => reRun(d.id)} className="p-1.5 rounded-lg bg-orange-500/15 text-orange-700 hover:bg-orange-500/25" title="再実行">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => removeJob(d.id)} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25" title="削除">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
