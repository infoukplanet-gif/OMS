"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { FileDown, History, RefreshCw, Calendar, Filter, FileSpreadsheet } from "lucide-react";

export type DownloadFilter = {
  key: string;
  label: string;
  options: string[];
  hint?: string;
  defaultValue?: string;
};

export type DownloadHistoryItem = {
  id: number;
  at: string;
  by: string;
  range: string;
  filters: string;
  format: string;
  records: number;
  status: "success" | "running" | "failed";
};

export type ScheduledExport = {
  id: number;
  name: string;
  schedule: string;
  format: string;
  recipients: string;
  enabled: boolean;
};

export type DownloadWizardProps = {
  title: string;
  description: string;
  hint: string;
  formats?: string[];
  filters?: DownloadFilter[];
  rangePresets?: { label: string; days: number }[];
  history: DownloadHistoryItem[];
  schedules?: ScheduledExport[];
  kpis?: { label: string; value: string; unit?: string }[];
  exampleColumns?: string[];
};

const DEFAULT_FORMATS = ["CSV", "Excel (xlsx)", "PDF"];
const DEFAULT_PRESETS = [
  { label: "今日", days: 0 },
  { label: "直近7日", days: 7 },
  { label: "今月", days: 30 },
  { label: "先月", days: 60 },
  { label: "今期", days: 365 },
];

export function DownloadWizard({
  title,
  description,
  hint,
  formats = DEFAULT_FORMATS,
  filters = [],
  rangePresets = DEFAULT_PRESETS,
  history,
  schedules = [],
  kpis = [],
  exampleColumns = [],
}: DownloadWizardProps) {
  const toast = useToast();
  const [format, setFormat] = useState(formats[0]);
  const [encoding, setEncoding] = useState("UTF-8 (BOM付き)");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [splitFile, setSplitFile] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((f) => [f.key, f.defaultValue ?? f.options[0]]))
  );

  const handleDownload = () => {
    toast.show(`${format} 形式でダウンロードを開始しました`, "success");
  };

  const handleScheduleToggle = (id: number) => {
    toast.show(`スケジュール ID ${id} を切替えました`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <HelpHint>{hint}</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <GlassCard key={k.label} className="p-4">
              <p className="text-sm text-gray-500">{k.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">
                {k.value}
                {k.unit && <span className="text-sm font-normal ml-1">{k.unit}</span>}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">対象期間</h2>
          <HelpHint>クイックボタンで素早く期間を指定するか、開始日・終了日を直接選択できます。</HelpHint>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {rangePresets.map((p) => (
            <button
              key={p.label}
              onClick={() => toast.show(`期間を「${p.label}」に設定しました`)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">開始日</label>
            <DatePicker placeholder="開始日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">終了日</label>
            <DatePicker placeholder="終了日を選択" />
          </div>
        </div>
      </GlassCard>

      {filters.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">絞り込み条件</h2>
            <HelpHint>必要な条件のみ指定してください。「すべて」を選ぶとその列の絞り込みは行いません。</HelpHint>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filters.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  {f.label}
                  {f.hint && <HelpHint side="right">{f.hint}</HelpHint>}
                </label>
                <select
                  value={filterValues[f.key]}
                  onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">出力形式・オプション</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">出力形式</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {formats.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              文字コード
              <HelpHint side="right">Excelで開く場合は BOM 付き UTF-8 を推奨。</HelpHint>
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              disabled={!format.startsWith("CSV")}
            >
              <option>UTF-8 (BOM付き)</option>
              <option>UTF-8 (BOM無し)</option>
              <option>Shift_JIS</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">改行コード</label>
            <select className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>CRLF (Windows)</option>
              <option>LF (Unix)</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHeader}
              onChange={(e) => setIncludeHeader(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            ヘッダー行を含める
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={splitFile}
              onChange={(e) => setSplitFile(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            10,000件ごとに分割
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <PrimaryButton onClick={handleDownload}>
            <FileDown className="h-4 w-4" />ダウンロード開始
          </PrimaryButton>
        </div>
      </GlassCard>

      {exampleColumns.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-gray-800">出力カラム（{exampleColumns.length}列）</h2>
            <HelpHint>このダウンロードに含まれるカラムの一覧。Excelでの並び順はこの通りです。</HelpHint>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleColumns.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-md text-xs bg-white/60 border border-white/50 text-gray-700"
              >
                {c}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      {schedules.length > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">定期エクスポート</h2>
            <HelpHint>定期的に同じ条件でダウンロードを生成し、メール添付・FTPアップロードに使えます。</HelpHint>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">スケジュール名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">実行タイミング</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">形式</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">配信先</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-white/30 hover:bg-white/40">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{s.schedule}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{s.format}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{s.recipients}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleScheduleToggle(s.id)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          s.enabled
                            ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                            : "bg-gray-400/15 text-gray-500 hover:bg-gray-400/25"
                        )}
                      >
                        {s.enabled ? "有効" : "停止中"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">ダウンロード履歴</h2>
          <HelpHint>過去 30日のダウンロード履歴。同じ条件で再ダウンロードできます。</HelpHint>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">実行者</th>
                <th className="text-left py-2 px-2 font-medium">期間</th>
                <th className="text-left py-2 px-2 font-medium">条件</th>
                <th className="text-left py-2 px-2 font-medium">形式</th>
                <th className="text-right py-2 px-2 font-medium">件数</th>
                <th className="text-center py-2 px-2 font-medium">結果</th>
                <th className="text-center py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40">
                  <td className="py-2 px-2 text-gray-700 text-xs tabular-nums">{h.at}</td>
                  <td className="py-2 px-2 text-gray-700">{h.by}</td>
                  <td className="py-2 px-2 text-gray-600 text-xs">{h.range}</td>
                  <td className="py-2 px-2 text-gray-500 text-xs">{h.filters}</td>
                  <td className="py-2 px-2 text-gray-700 text-xs">{h.format}</td>
                  <td className="py-2 px-2 text-right text-gray-700 tabular-nums">{h.records.toLocaleString()}</td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        h.status === "success" && "bg-emerald-500/15 text-emerald-700",
                        h.status === "running" && "bg-blue-500/15 text-blue-700",
                        h.status === "failed" && "bg-red-500/15 text-red-700"
                      )}
                    >
                      {h.status === "success" ? "正常" : h.status === "running" ? "実行中" : "失敗"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {h.status === "success" ? (
                      <button
                        onClick={() => toast.show("再ダウンロードを開始しました")}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        再DL
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
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
