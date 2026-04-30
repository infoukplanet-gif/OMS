"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Search } from "lucide-react";

type ProcessLog = {
  id: string;
  job: string;
  type: "出荷" | "入荷" | "在庫" | "返品" | "棚卸";
  startAt: string;
  endAt: string;
  duration: string;
  total: number;
  done: number;
  failed: number;
  status: "完了" | "実行中" | "失敗" | "待機";
  detail: string;
};

const data: ProcessLog[] = [
  { id: "RSL-PROC-20260430-0125", job: "出荷指示送信バッチ", type: "出荷", startAt: "2026/04/30 10:00", endAt: "2026/04/30 10:08", duration: "8m 12s", total: 145, done: 145, failed: 0, status: "完了", detail: "全件正常終了" },
  { id: "RSL-PROC-20260430-0124", job: "在庫数取得バッチ", type: "在庫", startAt: "2026/04/30 09:30", endAt: "2026/04/30 09:32", duration: "2m 4s", total: 845, done: 845, failed: 0, status: "完了", detail: "SKU 845件更新" },
  { id: "RSL-PROC-20260430-0123", job: "出荷実績取込", type: "出荷", startAt: "2026/04/30 09:00", endAt: "2026/04/30 09:02", duration: "1m 48s", total: 132, done: 132, failed: 0, status: "完了", detail: "送り状番号反映" },
  { id: "RSL-PROC-20260430-0122", job: "入荷予定送信", type: "入荷", startAt: "2026/04/30 06:00", endAt: "2026/04/30 06:01", duration: "55s", total: 8, done: 8, failed: 0, status: "完了", detail: "RSL受領確認済" },
  { id: "RSL-PROC-20260430-0121", job: "返品入荷取込", type: "返品", startAt: "2026/04/30 11:00", endAt: "—", duration: "実行中", total: 12, done: 8, failed: 0, status: "実行中", detail: "進捗 8/12" },
  { id: "RSL-PROC-20260429-0418", job: "棚卸結果取込", type: "棚卸", startAt: "2026/04/29 22:00", endAt: "2026/04/29 22:18", duration: "18m 4s", total: 8423, done: 8420, failed: 3, status: "完了", detail: "3件 ロケーション不一致" },
  { id: "RSL-PROC-20260429-0417", job: "出荷指示送信バッチ", type: "出荷", startAt: "2026/04/29 17:00", endAt: "2026/04/29 17:01", duration: "1m 12s", total: 8, done: 5, failed: 3, status: "失敗", detail: "RSL側受信制限により一部失敗" },
];

const sb: Record<string, string> = {
  完了: "bg-emerald-500/15 text-emerald-700",
  実行中: "bg-blue-500/15 text-blue-700",
  失敗: "bg-red-500/15 text-red-700",
  待機: "bg-gray-500/15 text-gray-500",
};

const typeBadge: Record<string, string> = {
  出荷: "bg-orange-500/10 text-orange-700",
  入荷: "bg-violet-500/10 text-violet-700",
  在庫: "bg-blue-500/10 text-blue-700",
  返品: "bg-rose-500/10 text-rose-700",
  棚卸: "bg-emerald-500/10 text-emerald-700",
};

export default function RsrLogiProcessStatusPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ProcessLog["type"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProcessLog["status"]>("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.id} ${d.job}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, typeFilter, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 処理状況一覧</h1>
            <HelpHint>RSLとの全データ同期バッチの実行履歴とリアルタイムステータス。失敗ジョブの詳細と再実行をここから操作できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">出荷・入荷・在庫・返品・棚卸の各バッチ進捗を統合監視。</p>
        </div>
        <SecondaryButton onClick={() => toast.show("処理状況を再読込しました", "info")}>
          <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />更新</span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日実行数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.filter((d) => d.startAt.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">実行中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data.filter((d) => d.status === "実行中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">完了</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.filter((d) => d.status === "完了").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">失敗（要対応）</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{data.filter((d) => d.status === "失敗").length}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="ジョブID・ジョブ名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">種別: すべて</option>
            <option value="出荷">出荷</option>
            <option value="入荷">入荷</option>
            <option value="在庫">在庫</option>
            <option value="返品">返品</option>
            <option value="棚卸">棚卸</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="完了">完了</option>
            <option value="実行中">実行中</option>
            <option value="失敗">失敗</option>
            <option value="待機">待機</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); }}>クリア</SecondaryButton>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ジョブ名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種別</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">開始 → 終了</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">所要</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">進捗</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">失敗</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">詳細</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{d.job}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", typeBadge[d.type])}>{d.type}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">
                  <div>{d.startAt}</div>
                  <div className="text-gray-400">{d.endAt}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 text-xs">{d.duration}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden min-w-[80px]">
                      <div
                        className={cn(
                          "h-full",
                          d.status === "失敗" ? "bg-red-500/70" : d.status === "完了" ? "bg-emerald-500/70" : "bg-blue-500/70"
                        )}
                        style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-20 text-right">{d.done}/{d.total}</span>
                  </div>
                </td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums text-xs", d.failed > 0 ? "text-red-600 font-medium" : "text-gray-400")}>{d.failed}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "完了" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "実行中" && <Clock className="h-3 w-3" />}
                    {d.status === "失敗" && <AlertCircle className="h-3 w-3" />}
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{d.detail}</td>
                <td className="px-3 py-2.5 text-center">
                  {d.status === "失敗" ? (
                    <button onClick={() => toast.show(`${d.id} を再実行しました`, "success")} className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 inline-flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />再送
                    </button>
                  ) : (
                    <button onClick={() => toast.show(`${d.id} の詳細を表示します`, "info")} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                      詳細
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
