"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { RefreshCw, Upload, Cloud, Database, History, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";

type HistoryItem = {
  id: string;
  type: string;
  target: string;
  started: string;
  ended: string;
  updated: number;
  total: number;
  result: "成功" | "部分成功" | "失敗" | "実行中";
};

const HISTORY: HistoryItem[] = [
  { id: "INV-UPD-20260425-003", type: "モール在庫連携", target: "楽天市場", started: "2026-04-25 16:30", ended: "2026-04-25 16:31", updated: 142, total: 142, result: "成功" },
  { id: "INV-UPD-20260425-002", type: "倉庫API在庫取込", target: "東京本社倉庫", started: "2026-04-25 09:15", ended: "2026-04-25 09:16", updated: 58, total: 58, result: "成功" },
  { id: "INV-UPD-20260425-001", type: "CSV手動取込", target: "大阪倉庫", started: "2026-04-25 08:40", ended: "2026-04-25 08:40", updated: 12, total: 12, result: "成功" },
  { id: "INV-UPD-20260424-045", type: "モール在庫連携", target: "Yahoo!ショッピング", started: "2026-04-24 23:00", ended: "2026-04-24 23:02", updated: 200, total: 205, result: "部分成功" },
  { id: "INV-UPD-20260424-040", type: "倉庫API在庫取込", target: "九州物流センター", started: "2026-04-24 09:00", ended: "2026-04-24 09:00", updated: 0, total: 84, result: "失敗" },
];

const RB: Record<HistoryItem["result"], string> = {
  成功: "bg-emerald-500/15 text-emerald-700",
  部分成功: "bg-amber-500/15 text-amber-700",
  失敗: "bg-red-500/15 text-red-700",
  実行中: "bg-blue-500/15 text-blue-700",
};

export default function InventoryUpdatePage() {
  const toast = useToast();
  const [scope, setScope] = useState("全倉庫");
  const [direction, setDirection] = useState<"both" | "in" | "out">("both");
  const [dryRun, setDryRun] = useState(false);

  const run = (kind: string) => {
    toast.show(`${kind} を${dryRun ? "シミュレーション" : "実行"}しました`, "success");
  };

  const stats = {
    today: HISTORY.filter((h) => h.started.startsWith("2026-04-25")).length,
    success: HISTORY.filter((h) => h.result === "成功").length,
    failed: HISTORY.filter((h) => h.result === "失敗").length,
    avgRecords: Math.round(HISTORY.reduce((s, h) => s + h.updated, 0) / HISTORY.length),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">在庫更新処理</h1>
            <HelpHint>
              モール・倉庫API・CSV取込による在庫数の一括更新を実行します。{"\n"}
              実在庫との差分はログに記録され、棚卸差異との突合に使えます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            本日の更新: <span className="font-semibold">{stats.today}</span> 回 ／ 失敗:{" "}
            <span className="font-semibold text-red-700">{stats.failed}</span> 回
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">本日の実行回数</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.today}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">成功</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.success}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">失敗</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.failed}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">平均更新件数</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.avgRecords}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">共通オプション</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              対象範囲
              <HelpHint side="right">特定倉庫のみ更新するか、全倉庫一括で更新するかを選びます。</HelpHint>
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["全倉庫", "東京本社倉庫", "大阪倉庫", "九州物流センター", "楽天スーパーロジ"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              連携方向
              <HelpHint side="right">「双方向」は実在庫を取得後、モールへ反映。「取込のみ」は受信のみ、「送信のみ」はモール反映のみ。</HelpHint>
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as typeof direction)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="both">双方向（取込＋反映）</option>
              <option value="in">取込のみ</option>
              <option value="out">モール反映のみ</option>
            </select>
          </div>
          <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 mt-6 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <span className="flex items-center gap-1.5">
              シミュレーション実行
              <HelpHint side="right">DBに反映せず、結果のプレビューだけ表示します。</HelpHint>
            </span>
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="accent-blue-500 w-4 h-4" />
          </label>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">モール在庫連携</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 flex-1">
            楽天・Yahoo!・Amazon・Shopifyから最新在庫を取得し、自社マスタへ反映。失敗時は自動リトライします。
          </p>
          <PrimaryButton onClick={() => run("モール在庫連携")} className="w-full">
            <RefreshCw className="h-4 w-4" />実行
          </PrimaryButton>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-800">倉庫API在庫取込</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 flex-1">
            楽天スーパーロジ・自社WMS・外部委託倉庫のAPIから実在庫を取得。差分のみ更新します。
          </p>
          <PrimaryButton onClick={() => run("倉庫API在庫取込")} className="w-full">
            <RefreshCw className="h-4 w-4" />実行
          </PrimaryButton>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-800">CSV手動取込</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 flex-1">
            CSVファイルから在庫数を一括上書き。マッピング済みフォーマットを推奨。
          </p>
          <button
            onClick={() => run("CSV手動取込")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90"
          >
            <Upload className="h-4 w-4" />ファイル選択
          </button>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">実行履歴</h2>
          <HelpHint>直近30回分の在庫更新履歴。失敗した実行は詳細ログを確認できます。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">処理ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">種別</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">開始</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">終了</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">更新/対象</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{h.id}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.type}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.target}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs tabular-nums">{h.started}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs tabular-nums">{h.ended}</td>
                  <td className="px-3 py-2 text-right text-gray-800 text-xs tabular-nums">
                    <span className="font-semibold">{h.updated}</span>/{h.total}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-0.5", RB[h.result])}>
                      {h.result === "成功" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {h.result}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toast.show(`${h.id} の詳細ログを表示`)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      ログ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
