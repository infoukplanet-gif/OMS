"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Wrench, CheckCircle2, AlertCircle, RefreshCw, Users, GitMerge, SkipForward } from "lucide-react";

type Status = "running" | "stopped";
type DuplicateAction = "merge" | "skip" | "create";

type AutoProcess = {
  id: string;
  name: string;
  description: string;
  status: Status;
};

type SourceRule = {
  source: string;
  enabled: boolean;
  trigger: string;
  lastRun: string;
  createdThisMonth: number;
  mergedThisMonth: number;
};

type ExecutionLog = {
  id: number;
  at: string;
  trigger: string;
  created: number;
  merged: number;
  skipped: number;
  status: "success" | "warning" | "error";
  detail?: string;
};

const initialAutoProcesses: AutoProcess[] = [
  {
    id: "customer-create",
    name: "顧客マスタ自動作成",
    description: "新規受注取込時に未登録顧客を検出したら、受注情報から顧客マスタを作成します。",
    status: "running",
  },
  {
    id: "duplicate-merge",
    name: "重複顧客自動マージ",
    description: "メールアドレスや電話番号が一致する顧客を自動的にマージします。重複候補が見つかった場合の挙動は重複判定ルールに従います。",
    status: "running",
  },
  {
    id: "rank-update",
    name: "顧客ランク自動更新",
    description: "購入金額・購入回数に応じて顧客ランク（一般/シルバー/ゴールド/VIP）を毎日深夜に再計算します。",
    status: "running",
  },
  {
    id: "duplicate-notify",
    name: "重複候補通知",
    description: "判定が曖昧な重複候補が出た場合、担当者にメール通知します。",
    status: "stopped",
  },
  {
    id: "blacklist-check",
    name: "ブラックリスト自動チェック",
    description: "受注取込時にブラックリスト顧客を検出して受注をホールドします。",
    status: "running",
  },
  {
    id: "wholesale-suggest",
    name: "卸先候補自動提案",
    description: "購入回数・金額が一定以上の顧客を卸先候補として担当者に提案します。",
    status: "stopped",
  },
];

const initialSourceRules: SourceRule[] = [
  { source: "楽天市場", enabled: true, trigger: "受注取込時", lastRun: "2026-04-25 09:15", createdThisMonth: 142, mergedThisMonth: 38 },
  { source: "Yahoo!ショッピング", enabled: true, trigger: "受注取込時", lastRun: "2026-04-25 09:15", createdThisMonth: 67, mergedThisMonth: 14 },
  { source: "Amazon", enabled: true, trigger: "受注取込時", lastRun: "2026-04-25 09:15", createdThisMonth: 48, mergedThisMonth: 9 },
  { source: "自社EC（Shopify）", enabled: true, trigger: "API取込時", lastRun: "2026-04-25 09:08", createdThisMonth: 89, mergedThisMonth: 22 },
  { source: "メール受注", enabled: false, trigger: "メール解析時", lastRun: "—", createdThisMonth: 0, mergedThisMonth: 0 },
  { source: "卸先EDI", enabled: true, trigger: "EDI取込時", lastRun: "2026-04-24 23:50", createdThisMonth: 12, mergedThisMonth: 3 },
];

const executionLogs: ExecutionLog[] = [
  { id: 1, at: "2026-04-25 09:15", trigger: "楽天受注取込（バッチ）", created: 14, merged: 4, skipped: 0, status: "success" },
  { id: 2, at: "2026-04-25 09:08", trigger: "自社ECリアルタイム", created: 8, merged: 2, skipped: 1, status: "warning", detail: "1件、メール形式不正のためスキップ" },
  { id: 3, at: "2026-04-25 06:00", trigger: "Amazon受注取込（バッチ）", created: 6, merged: 1, skipped: 0, status: "success" },
  { id: 4, at: "2026-04-24 23:50", trigger: "卸先EDI取込", created: 2, merged: 0, skipped: 0, status: "success" },
  { id: 5, at: "2026-04-24 18:32", trigger: "Yahoo受注取込", created: 11, merged: 3, skipped: 2, status: "warning", detail: "2件、住所欠損のためスキップ" },
  { id: 6, at: "2026-04-24 14:05", trigger: "メール解析", created: 0, merged: 0, skipped: 1, status: "error", detail: "メール解析エンジン応答なし" },
];

export default function CustomerAutoCreatePage() {
  const toast = useToast();
  const [processes, setProcesses] = useState<AutoProcess[]>(initialAutoProcesses);
  const [sourceRules, setSourceRules] = useState<SourceRule[]>(initialSourceRules);

  const [emailDup, setEmailDup] = useState(true);
  const [phoneDup, setPhoneDup] = useState(true);
  const [nameAddrDup, setNameAddrDup] = useState(false);
  const [logEnabled, setLogEnabled] = useState(true);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>("merge");
  const [defaultRank, setDefaultRank] = useState("一般");

  const totals = {
    created: sourceRules.reduce((s, r) => s + r.createdThisMonth, 0),
    merged: sourceRules.reduce((s, r) => s + r.mergedThisMonth, 0),
    skipped: executionLogs.reduce((s, l) => s + l.skipped, 0),
  };

  function setProcessStatus(id: string, status: Status) {
    setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function toggleSource(source: string) {
    setSourceRules((prev) => prev.map((r) => (r.source === source ? { ...r, enabled: !r.enabled } : r)));
  }

  function handleSave() {
    const running = processes.filter((p) => p.status === "running").length;
    toast.show(`自動実行処理を保存しました（${running}/${processes.length} 処理を起動中）`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">顧客マスタ自動作成</h1>
            <p className="text-sm text-gray-500 mt-1">
              受注取込時に未登録顧客を検出した場合、受注情報から顧客マスタを自動的に作成します。重複判定ルールに従って既存顧客とのマージも行えます。
            </p>
          </div>
          <HelpHint side="bottom">
            この処理を「起動」にすると、新規受注取込時に顧客マスタを自動作成します。{"\n"}
            重複判定ルールで既存顧客と一致した場合は、設定に従ってマージ・スキップ・新規作成のいずれかが行われます。
          </HelpHint>
        </div>
        <PrimaryButton onClick={handleSave}>
          <Wrench className="h-4 w-4" />自動実行処理を変更
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Users className="h-4 w-4" />今月の自動作成</div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{totals.created.toLocaleString()}<span className="text-sm font-normal ml-1">件</span></p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><GitMerge className="h-4 w-4" />既存顧客とマージ</div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{totals.merged.toLocaleString()}<span className="text-sm font-normal ml-1">件</span></p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><SkipForward className="h-4 w-4" />スキップ件数</div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{totals.skipped.toLocaleString()}<span className="text-sm font-normal ml-1">件</span></p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">関連自動実行処理</h2>
          <HelpHint>
            顧客マスタ周りで自動実行される処理一覧です。{"\n"}
            「起動」にした処理は受注取込やバッチで自動的に動きます。「停止」中の処理はマニュアル実行のみ可能です。
          </HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">処理名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">説明</th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.id} className="border-t border-white/30">
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-800">{p.name}</span>
                      <HelpHint side="right">{p.description}</HelpHint>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 align-top">{p.description}</td>
                  <td className="px-4 py-3 text-center align-top">
                    <select
                      value={p.status}
                      onChange={(e) => setProcessStatus(p.id, e.target.value as Status)}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                        p.status === "running"
                          ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-700"
                          : "bg-gray-200/60 border-gray-300/40 text-gray-600"
                      )}
                    >
                      <option value="running">起動</option>
                      <option value="stopped">停止</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">重複判定ルール</h2>
          <HelpHint>
            受注情報と既存顧客マスタを照合する条件です。{"\n"}
            複数の条件をONにすると、いずれかが一致した場合に既存顧客と判定されます。
          </HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={emailDup} onChange={(e) => setEmailDup(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            メールアドレスが同一なら既存顧客と判定
            <HelpHint side="right">最も一般的な判定キー。モール購入では同一メールが同じ人物と見なされます。</HelpHint>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={phoneDup} onChange={(e) => setPhoneDup(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            電話番号が同一なら既存顧客と判定
            <HelpHint side="right">電話のハイフン有無は内部で正規化して比較します。</HelpHint>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={nameAddrDup} onChange={(e) => setNameAddrDup(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            氏名＋住所（郵便番号一致）で判定
            <HelpHint side="right">同一住所での再注文を吸収できますが、家族など別人を誤マージする可能性もあります。</HelpHint>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={logEnabled} onChange={(e) => setLogEnabled(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            判定結果をログ出力する
            <HelpHint side="right">後から判定理由を追跡できるように、判定ログを保存します。</HelpHint>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/40">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              重複時の動作
              <HelpHint side="right">
                既存顧客と判定された時にシステムが取る挙動です。{"\n"}
                マージ: 受注を既存顧客に紐付け、不足項目を補完。{"\n"}
                スキップ: 受注のみ取込み、顧客マスタは触らない。{"\n"}
                新規作成: 重複でも別顧客として登録（非推奨）。
              </HelpHint>
            </label>
            <select
              value={duplicateAction}
              onChange={(e) => setDuplicateAction(e.target.value as DuplicateAction)}
              className="w-full h-10 px-3 rounded-xl text-sm bg-white/60 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="merge">既存顧客にマージ（推奨）</option>
              <option value="skip">既存顧客あり時はスキップ</option>
              <option value="create">重複でも新規作成する</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              新規作成時のデフォルト顧客ランク
              <HelpHint side="right">自動作成された顧客に最初に付く顧客ランクです。後から購入実績で上書きされます。</HelpHint>
            </label>
            <select
              value={defaultRank}
              onChange={(e) => setDefaultRank(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-sm bg-white/60 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="一般">一般</option>
              <option value="シルバー">シルバー</option>
              <option value="ゴールド">ゴールド</option>
              <option value="VIP">VIP候補</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">取得元別ルール</h2>
          <HelpHint>
            取込元ごとに自動作成の有効/無効を切り替えられます。{"\n"}
            モール側で十分に顧客情報が取得できないチャネルは無効にしておくと、不完全な顧客レコードを防げます。
          </HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">取得元</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">トリガー</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">最終実行</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">今月作成</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">マージ</th>
              </tr>
            </thead>
            <tbody>
              {sourceRules.map((r) => (
                <tr key={r.source} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.source}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{r.trigger}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSource(r.source)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                        r.enabled
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                          : "bg-gray-400/15 text-gray-500 hover:bg-gray-400/25"
                      )}
                    >
                      {r.enabled ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.lastRun}</td>
                  <td className="px-4 py-3 text-right text-gray-800 tabular-nums">{r.createdThisMonth}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{r.mergedThisMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">実行履歴</h2>
            <HelpHint>
              直近の自動作成バッチの実行ログです。{"\n"}
              スキップやエラーが起きた取込は「詳細」から原因を確認できます。
            </HelpHint>
          </div>
          <button
            type="button"
            onClick={() => toast.show("実行履歴を再読み込みしました")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />更新
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">トリガー</th>
                <th className="text-right py-2 px-2 font-medium">作成</th>
                <th className="text-right py-2 px-2 font-medium">マージ</th>
                <th className="text-right py-2 px-2 font-medium">スキップ</th>
                <th className="text-center py-2 px-2 font-medium">ステータス</th>
                <th className="text-left py-2 px-2 font-medium">備考</th>
              </tr>
            </thead>
            <tbody>
              {executionLogs.map((l) => (
                <tr key={l.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{l.at}</td>
                  <td className="py-2 px-2 text-gray-700">{l.trigger}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 tabular-nums">{l.created}</td>
                  <td className="py-2 px-2 text-right text-blue-700 tabular-nums">{l.merged}</td>
                  <td className={cn("py-2 px-2 text-right tabular-nums", l.skipped > 0 ? "text-amber-700" : "text-gray-400")}>{l.skipped}</td>
                  <td className="py-2 px-2 text-center">
                    {l.status === "success" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700"><CheckCircle2 className="h-3 w-3" />正常</span>}
                    {l.status === "warning" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-700"><AlertCircle className="h-3 w-3" />警告</span>}
                    {l.status === "error" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700"><AlertCircle className="h-3 w-3" />エラー</span>}
                  </td>
                  <td className="py-2 px-2 text-gray-500 text-xs">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
