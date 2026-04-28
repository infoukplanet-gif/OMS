"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, Settings2, Clock, Play, History, Boxes, AlertTriangle, CheckCircle2 } from "lucide-react";

type Job = {
  id: string;
  name: string;
  schedule: string;
  target: string;
  enabled: boolean;
  lastRun: string;
  result: "成功" | "失敗" | "—";
  count: number;
};

const INITIAL_JOBS: Job[] = [
  { id: "J-01", name: "朝次自動引当", schedule: "毎日 09:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-25 09:00", result: "成功", count: 142 },
  { id: "J-02", name: "昼次自動引当", schedule: "毎日 13:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-25 13:00", result: "成功", count: 58 },
  { id: "J-03", name: "夕次自動引当", schedule: "毎日 17:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-24 17:00", result: "成功", count: 73 },
  { id: "J-04", name: "緊急引当（予約商品）", schedule: "発売日 00:00", target: "予約商品全件", enabled: false, lastRun: "—", result: "—", count: 0 },
  { id: "J-05", name: "卸先優先引当", schedule: "毎日 08:30", target: "卸先受注のみ", enabled: true, lastRun: "2026-04-25 08:30", result: "成功", count: 28 },
];

const RECENT_LOG = [
  { id: 1, at: "2026-04-25 13:00", job: "昼次自動引当", success: 58, partial: 0, failed: 0 },
  { id: 2, at: "2026-04-25 09:00", job: "朝次自動引当", success: 140, partial: 2, failed: 0 },
  { id: 3, at: "2026-04-25 08:30", job: "卸先優先引当", success: 28, partial: 0, failed: 0 },
  { id: 4, at: "2026-04-24 17:00", job: "夕次自動引当", success: 71, partial: 1, failed: 1 },
];

export default function AllocationAutoPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [order, setOrder] = useState("受注日昇順");
  const [statusTarget, setStatusTarget] = useState("新規受付・入金済み");
  const [partialAllow, setPartialAllow] = useState(false);
  const [failAction, setFailAction] = useState("欠品ステータスへ");
  const [vipPriority, setVipPriority] = useState(true);
  const [reservePriority, setReservePriority] = useState(true);
  const [holdNotify, setHoldNotify] = useState(true);

  const toggleJob = (id: string) =>
    setJobs(jobs.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">引当自動実行処理</h1>
            <HelpHint>
              定時スケジュールで受注に対する在庫引当を自動実行します。{"\n"}
              引当順序・優先度ルール・失敗時の挙動などをここで集中管理します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            稼働ジョブ: <span className="font-semibold text-emerald-700">{jobs.filter((j) => j.enabled).length}</span> ／
            本日の引当件数: <span className="font-semibold">{jobs.reduce((s, j) => s + j.count, 0)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("マニュアル引当を実行しました", "success")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Play className="h-4 w-4" />マニュアル実行
          </button>
          <PrimaryButton onClick={() => toast.show("引当ルールを保存しました", "success")}>
            <Save className="h-4 w-4" />設定を保存
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">本日の引当件数</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{jobs.reduce((s, j) => s + j.count, 0)}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">稼働ジョブ</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{jobs.filter((j) => j.enabled).length}<span className="text-sm font-normal ml-1">/{jobs.length}</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">部分引当</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">3</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">失敗（要確認）</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">1</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">引当ルール</h2>
          <HelpHint>すべての自動引当ジョブで共通のルール。受注の処理順や優先度を決めます。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              引当順序
              <HelpHint side="right">受注を引き当てる順番。古い受注からが基本ですが、VIP優先などにも変更できます。</HelpHint>
            </label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["受注日昇順", "出荷予定日昇順", "金額降順", "VIP/卸先優先", "ランダム"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">引当対象ステータス</label>
            <select
              value={statusTarget}
              onChange={(e) => setStatusTarget(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["新規受付・入金済み", "新規受付のみ", "入金済みのみ", "確認待ちも含む"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              引当失敗時の挙動
              <HelpHint side="right">在庫不足で引き当てられない場合の処理。</HelpHint>
            </label>
            <select
              value={failAction}
              onChange={(e) => setFailAction(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["欠品ステータスへ", "保留にする", "次回バッチへ繰越", "アラート通知のみ"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <Toggle label="部分引当を許可" checked={partialAllow} onChange={setPartialAllow} hint="ONの場合、明細単位で在庫があるものだけ引当ます。" />
          <Toggle label="VIP顧客を優先引当" checked={vipPriority} onChange={setVipPriority} hint="顧客ランクVIP/プラチナ受注を優先します。" />
          <Toggle label="予約商品を優先引当" checked={reservePriority} onChange={setReservePriority} hint="発売日前の予約受注を優先します。" />
          <Toggle label="保留発生時に通知メール" checked={holdNotify} onChange={setHoldNotify} hint="OFFにすると、欠品保留のみダッシュボードで確認します。" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">スケジュールジョブ</h2>
          <HelpHint>定時スケジュールで実行される引当ジョブ。停止したジョブはマニュアル実行のみ可能です。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ジョブ名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">スケジュール</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">結果</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">引当件数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-4 py-3 font-medium text-gray-800">{j.name}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{j.schedule}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{j.target}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleJob(j.id)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        j.enabled ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" : "bg-gray-400/15 text-gray-500 hover:bg-gray-400/25"
                      )}
                    >
                      {j.enabled ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{j.lastRun}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        j.result === "成功" && "bg-emerald-500/15 text-emerald-700",
                        j.result === "失敗" && "bg-red-500/15 text-red-700",
                        j.result === "—" && "bg-gray-400/15 text-gray-500"
                      )}
                    >
                      {j.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-800">{j.count}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toast.show(`${j.name} を即時実行しました`, "success")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      即時実行
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">直近実行ログ</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ジョブ</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">成功</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">部分</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">失敗</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_LOG.map((l) => (
                <tr key={l.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{l.at}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{l.job}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{l.success}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", l.partial > 0 ? "text-amber-700" : "text-gray-400")}>{l.partial}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", l.failed > 0 ? "text-red-700 font-bold" : "text-gray-400")}>{l.failed}</td>
                  <td className="px-3 py-2 text-center">
                    {l.failed === 0 && l.partial === 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />正常
                      </span>
                    ) : l.failed > 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700">
                        <AlertTriangle className="h-3 w-3" />要確認
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <AlertTriangle className="h-3 w-3" />部分成功
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Boxes className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">引当処理で実行される連動操作</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "受注ステータスを「引当済み」へ更新",
            "在庫の引当数を加算（フリー在庫数を減算）",
            "セット商品は構成品ごとに引当",
            "倉庫優先順位に従って割り当て",
            "在庫不足時はバックオーダーまたは欠品処理へ",
            "引当ログを監査用に保存",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
      <span className="flex items-center gap-1.5">
        {label}
        {hint && <HelpHint side="right">{hint}</HelpHint>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-4 h-4" />
    </label>
  );
}
