"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Upload, Download, History, CheckCircle2, AlertCircle } from "lucide-react";

const HISTORY = [
  { id: "BULK-2026-0024", at: "2026-04-25 09:42", by: "佐藤 健", source: "三井住友銀行 入出金明細.csv", records: 184, matched: 178, unmatched: 6, status: "success" as const },
  { id: "BULK-2026-0023", at: "2026-04-24 10:18", by: "佐藤 健", source: "みずほ銀行 入出金明細.csv", records: 92, matched: 90, unmatched: 2, status: "success" as const },
  { id: "BULK-2026-0022", at: "2026-04-23 14:32", by: "鈴木 美咲", source: "Stripe 売上確定.csv", records: 248, matched: 248, unmatched: 0, status: "success" as const },
  { id: "BULK-2026-0021", at: "2026-04-22 16:00", by: "高橋 翔", source: "代引一覧（ヤマト）.csv", records: 0, matched: 0, unmatched: 0, status: "failed" as const },
];

export default function PaymentBulkPage() {
  const toast = useToast();
  const [source, setSource] = useState("三井住友銀行 入出金CSV");
  const [autoMatch, setAutoMatch] = useState(true);
  const [matchKey, setMatchKey] = useState<"order" | "amount_name" | "ref">("order");
  const [dryRun, setDryRun] = useState(false);

  const upload = () => toast.show(dryRun ? "シミュレーション実行を開始しました" : "一括入金処理を開始しました", "success");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">一括入金処理</h1>
            <HelpHint>
              銀行の入出金明細CSV・モール売上CSV・代引集計CSVなどを取り込み、{"\n"}
              受注番号・金額・名義から自動マッチングして入金確定します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            銀行明細・代引・モール売上CSVから一括取込。マッチしない明細は手動消込画面に移動します。
          </p>
        </div>
        <button
          onClick={() => toast.show("テンプレートCSVをダウンロード")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
        >
          <Download className="h-4 w-4" />テンプレートDL
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">取込元フォーマット</h2>
          <HelpHint>使用する明細の出力元を選ぶと、列マッピングが自動最適化されます。</HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["三井住友銀行 入出金CSV", "みずほ銀行 入出金CSV", "三菱UFJ 入出金CSV", "Stripe 売上確定CSV", "ヤマト代引明細", "佐川e-コレクト", "汎用CSV（マッピング指定）"].map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                source === s ? "bg-blue-500/15 border-blue-300/50 text-blue-700" : "bg-white/50 border-white/40 text-gray-700 hover:bg-white/70"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div
          onClick={upload}
          className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed border-blue-300/60 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer"
        >
          <Upload className="h-10 w-10 text-blue-500" />
          <p className="text-base font-medium text-gray-700">CSVファイルをドラッグ＆ドロップ</p>
          <PrimaryButton onClick={upload}>
            <Upload className="h-4 w-4" />ファイルを選択
          </PrimaryButton>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">マッチングオプション</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="自動マッチング" checked={autoMatch} onChange={setAutoMatch} hint="OFFの場合、すべて手動消込画面で処理します。" />
          <Toggle label="シミュレーション実行" checked={dryRun} onChange={setDryRun} hint="DBに反映せず、結果のプレビューだけ表示。" />
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              マッチングキー
              <HelpHint side="right">「受注番号」が最確実。「金額+名義」は名前ゆれに弱いです。</HelpHint>
            </label>
            <select
              value={matchKey}
              onChange={(e) => setMatchKey(e.target.value as typeof matchKey)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="order">受注番号（推奨）</option>
              <option value="amount_name">金額＋振込名義</option>
              <option value="ref">参照番号（請求書番号）</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">取込履歴</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">取込元</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">明細</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">マッチ</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">未消込</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{h.id}</td>
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.source}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{h.records}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-medium">{h.matched}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", h.unmatched > 0 ? "text-amber-700" : "text-gray-400")}>{h.unmatched}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium",
                      h.status === "success" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
                    )}>
                      {h.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {h.status === "success" ? "正常" : "失敗"}
                    </span>
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

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
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
