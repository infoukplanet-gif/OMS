"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Search } from "lucide-react";
import { DetailModal, type DetailRow } from "@/components/ui/detail-modal";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { rslProcessLogStore, type RslProcessLog } from "@/lib/stores/rsl-process-log-store";
import { INITIAL_RSL_PROCESS_LOGS } from "@/lib/seeds/rsl-process-log";

type ProcessLog = RslProcessLog;

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

  usePersistentStore({
    store: rslProcessLogStore,
    domain: "rsl-process-log",
    seed: INITIAL_RSL_PROCESS_LOGS,
  });
  const items = useSyncExternalStore(
    (cb) => rslProcessLogStore.subscribe(cb),
    () => rslProcessLogStore.getState(),
    () => INITIAL_RSL_PROCESS_LOGS as readonly ProcessLog[],
  );

  const [lastChecked, setLastChecked] = useState("10:08");
  const [refreshing, setRefreshing] = useState(false);
  const [detailRow, setDetailRow] = useState<ProcessLog | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((d) => {
      if (k && !`${d.id} ${d.job}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, typeFilter, statusFilter]);

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLastChecked(ts);
      toast.show("処理状況を再読込しました", "info");
    }, 1000);
  }

  function handleRetry(id: string) {
    const target = rslProcessLogStore.findById(id);
    if (!target) return;
    rslProcessLogStore.upsert({
      ...target,
      status: "実行中",
      endAt: "—",
      duration: "実行中",
      failed: 0,
      done: 0,
      detail: "再実行中...",
    });
    setTimeout(() => {
      const current = rslProcessLogStore.findById(id);
      if (!current || current.status !== "実行中") return;
      const now = new Date();
      const ts = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      rslProcessLogStore.upsert({
        ...current,
        status: "完了",
        endAt: ts,
        duration: "1m 08s",
        done: current.total,
        detail: "再実行完了",
      });
      toast.show(`ジョブを再実行しました`, "success");
    }, 2000);
  }

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
        <SecondaryButton onClick={handleRefresh} disabled={refreshing}>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "読込中..." : `更新 (${lastChecked})`}
          </span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日実行数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.filter((d) => d.startAt.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">実行中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((d) => d.status === "実行中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">完了</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((d) => d.status === "完了").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">失敗（要対応）</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{items.filter((d) => d.status === "失敗").length}</div>
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
          {filtered.length} 件 / 全 {items.length} 件
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
            {filtered.map((d: ProcessLog) => (
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
                    <button onClick={() => handleRetry(d.id)} className="px-3 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 inline-flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />再送
                    </button>
                  ) : d.status === "実行中" ? (
                    <span className="text-xs text-blue-600 flex items-center gap-1"><Clock className="h-3 w-3" />実行中</span>
                  ) : (
                    <button onClick={() => setDetailRow(d)} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                      詳細
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <DetailModal
        open={detailRow !== null}
        title="処理ジョブの詳細"
        subtitle={detailRow?.job}
        rows={
          detailRow
            ? ([
                { label: "ジョブID", value: detailRow.id, mono: true },
                { label: "ジョブ名", value: detailRow.job },
                { label: "種別", value: detailRow.type },
                { label: "開始", value: detailRow.startAt },
                { label: "終了", value: detailRow.endAt },
                { label: "所要時間", value: detailRow.duration },
                { label: "処理件数", value: `${detailRow.done} / ${detailRow.total}` },
                {
                  label: "失敗件数",
                  value: detailRow.failed,
                  tone: detailRow.failed > 0 ? "danger" : "default",
                },
                {
                  label: "状態",
                  value: detailRow.status,
                  tone:
                    detailRow.status === "完了"
                      ? "success"
                      : detailRow.status === "失敗"
                        ? "danger"
                        : detailRow.status === "実行中"
                          ? "warning"
                          : "default",
                },
                { label: "詳細", value: detailRow.detail },
              ] satisfies DetailRow[])
            : []
        }
        onClose={() => setDetailRow(null)}
      />
    </div>
  );
}
