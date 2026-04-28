"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, AlertCircle, History, Download } from "lucide-react";

type ImportLog = {
  id: number;
  at: string;
  by: string;
  source: string;
  records: number;
  success: number;
  failed: number;
  status: "success" | "failed" | "warning";
};

const HISTORY: ImportLog[] = [
  { id: 1, at: "2026-04-25 10:24", by: "佐藤 健", source: "ヤマトB2 配送結果.csv", records: 184, success: 184, failed: 0, status: "success" },
  { id: 2, at: "2026-04-24 15:42", by: "鈴木 美咲", source: "佐川e飛伝II_20260424.csv", records: 92, success: 90, failed: 2, status: "warning" },
  { id: 3, at: "2026-04-24 09:18", by: "システム", source: "ゆうプリR出荷確定.csv", records: 48, success: 48, failed: 0, status: "success" },
  { id: 4, at: "2026-04-23 16:00", by: "田中 花子", source: "shipment_notify.csv", records: 0, success: 0, failed: 0, status: "failed" },
];

export default function ShipmentsNotificationImportPage() {
  const toast = useToast();
  const [source, setSource] = useState("ヤマトB2 配送結果CSV");
  const [skipDuplicate, setSkipDuplicate] = useState(true);
  const [autoNotifyMall, setAutoNotifyMall] = useState(true);
  const [sendCustomerEmail, setSendCustomerEmail] = useState(true);
  const [dryRun, setDryRun] = useState(false);

  const handleFile = () => {
    toast.show(dryRun ? "シミュレーション実行を開始しました" : "出荷通知の取込を開始しました", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">出荷通知一括登録</h1>
            <HelpHint>
              配送業者システム（ヤマトB2・佐川e飛伝II・ゆうプリRなど）から出力された配送結果CSVを取り込み、{"\n"}
              受注に追跡番号を自動反映します。モールへの通知メールも自動キューイングできます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            CSV取込で複数受注の追跡番号・出荷情報を一括反映。フォーマットは配送業者ごとに自動判定します。
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
          <FileText className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">取込元フォーマット</h2>
          <HelpHint>使用する配送業者システムを選ぶと、列マッピングが自動的に最適化されます。</HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "ヤマトB2 配送結果CSV",
            "佐川e飛伝II 出荷結果CSV",
            "ゆうプリR 出荷確定CSV",
            "西濃ピッキングカンガルー",
            "汎用CSV（マッピング指定）",
            "Shopify配送通知",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                source === s
                  ? "bg-blue-500/15 border-blue-300/50 text-blue-700"
                  : "bg-white/50 border-white/40 text-gray-700 hover:bg-white/70"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div
          onClick={handleFile}
          className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed border-blue-300/60 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer"
        >
          <Upload className="h-10 w-10 text-blue-500" />
          <p className="text-base font-medium text-gray-700">CSVファイルをドラッグ＆ドロップ</p>
          <p className="text-xs text-gray-500">または下のボタンからファイル選択</p>
          <PrimaryButton onClick={handleFile}>
            <Upload className="h-4 w-4" />ファイルを選択
          </PrimaryButton>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-800">取込オプション</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="既存追跡番号と重複した場合スキップ" checked={skipDuplicate} onChange={setSkipDuplicate} hint="OFFの場合は上書きします。" />
          <Toggle label="モール（楽天/Yahoo!/Amazon）へ自動通知" checked={autoNotifyMall} onChange={setAutoNotifyMall} hint="OFFの場合は別途出荷通知ダウンロード画面で手動連携。" />
          <Toggle label="顧客への発送完了メールを自動送信" checked={sendCustomerEmail} onChange={setSendCustomerEmail} />
          <Toggle label="シミュレーション実行（DBに反映しない）" checked={dryRun} onChange={setDryRun} hint="ONで取込内容のプレビューだけ行います。" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">取込履歴</h2>
          <HelpHint>過去30日の取込履歴。失敗した取込はログをダウンロードして原因確認できます。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">実行者</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">取込元</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">件数</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">成功</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">失敗</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">結果</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-700">{h.by}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{h.source}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">{h.records}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{h.success}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", h.failed > 0 ? "text-red-700 font-semibold" : "text-gray-400")}>
                    {h.failed}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {h.status === "success" ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />正常
                      </span>
                    ) : h.status === "warning" ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <AlertCircle className="h-3 w-3" />警告
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700">
                        <AlertCircle className="h-3 w-3" />失敗
                      </span>
                    )}
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
