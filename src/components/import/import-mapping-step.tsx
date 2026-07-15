"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Check, AlertCircle, FileSpreadsheet, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportFieldDef } from "@/lib/import/field-registry";
import { missingRequiredKeys } from "@/lib/import/auto-map";

export type MappingRow = {
  csv: string;
  sample: string;
  system: string;
  matched: boolean;
  transform?: string;
};

interface ImportMappingStepProps {
  fileName: string;
  totalRows: number;
  templates: string[];
  templateKey: string;
  onTemplateChange: (key: string) => void;
  onTemplateAdd: (name: string) => void;
  systemFields: string[];
  mappingRows: MappingRow[];
  onMappingChange?: (csv: string, system: string) => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  helpText?: string;
  /** 宣言的フィールド定義。渡すと「自動マッピング」ボタンと必須項目チェックが有効になる。 */
  fields?: ImportFieldDef[];
  /** 「自動マッピング」ボタン押下時のハンドラ。fields と併用する。 */
  onAutoMap?: () => void;
}

export function ImportMappingStep({
  fileName,
  totalRows,
  templates,
  templateKey,
  onTemplateChange,
  onTemplateAdd,
  systemFields,
  mappingRows,
  onMappingChange,
  onBack,
  onNext,
  nextLabel = "次へ: バリデーション",
  helpText,
  fields,
  onAutoMap,
}: ImportMappingStepProps) {
  const toast = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const missingRequired = fields ? missingRequiredKeys(fields, mappingRows) : [];

  function saveTemplate() {
    const name = saveName.trim();
    if (!name) return toast.show("テンプレート名を入力してください", "error");
    if (templates.includes(name)) return toast.show(`「${name}」は既に存在します`, "error");
    onTemplateAdd(name);
    setSaveName("");
    setSaveOpen(false);
    toast.show(`テンプレート「${name}」を保存しました`);
  }

  const unmatched = mappingRows.filter((r) => !r.matched && !r.system).length;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800">マッピング設定</h2>
          <HelpHint>
            {helpText ??
              "外部ファイルの列名をシステムマスタの項目に紐付けます。\n「自動マッピング」で大半の列を一括紐付けし、自動で当たらなかった列（琥珀色）は各行のドロップダウンから手動で選べます。\nテンプレートとして保存すれば、次回同じ取込元のデータをワンクリックで再利用できます。"}
          </HelpHint>
        </div>
        <div className="flex items-center gap-2">
          {onAutoMap && (
            <button
              type="button"
              onClick={onAutoMap}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium text-blue-700 bg-blue-500/10 border border-blue-300/50 hover:bg-blue-500/20 transition-colors"
            >
              <Wand2 className="h-4 w-4" />
              自動マッピング
            </button>
          )}
          <label className="text-sm font-medium text-gray-700">テンプレート:</label>
          <select
            value={templateKey}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {templates.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <SecondaryButton onClick={() => setSaveOpen(true)}>新規保存</SecondaryButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">外部CSVの列名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">サンプルデータ</th>
              <th className="w-10 px-2 py-3 text-center text-gray-400">→</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">システム項目</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {mappingRows.map((row) => (
              <tr
                key={row.csv}
                className={cn(
                  "border-t border-white/30 transition-colors",
                  !row.matched && !row.system && "bg-amber-500/[0.07]"
                )}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{row.csv}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{row.sample}</td>
                <td className="px-2 py-3 text-center text-gray-300">→</td>
                <td className="px-4 py-3">
                  <select
                    value={row.system || ""}
                    onChange={(e) => onMappingChange?.(row.csv, e.target.value)}
                    aria-label={`「${row.csv}」の紐付け先システム項目`}
                    className={cn(
                      "h-8 px-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2",
                      row.system
                        ? "bg-white/50 border border-white/50 focus:ring-blue-500/20"
                        : "bg-amber-50/80 border border-amber-400/70 text-amber-800 ring-1 ring-amber-300/40 focus:ring-amber-500/30"
                    )}
                  >
                    <option value="">未選択（手動で選ぶ）</option>
                    {systemFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {row.transform && (
                    <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-700">
                      ⚙ {row.transform}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.matched ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="h-3.5 w-3.5" />自動マッチ
                    </span>
                  ) : !row.system ? (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                      <AlertCircle className="h-3.5 w-3.5" />未設定
                    </span>
                  ) : row.system === "スキップ（取り込まない）" ? (
                    <span className="text-xs text-gray-400">スキップ</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      <Check className="h-3.5 w-3.5" />手動設定
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-500">
          <FileSpreadsheet className="h-4 w-4 inline mr-1" />
          {fileName} — {totalRows.toLocaleString()} 件のデータを読み込み済み
          {unmatched > 0 && (
            <span className="ml-3 text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />未設定 {unmatched} 列（ドロップダウンから手動で選択）
            </span>
          )}
          {missingRequired.length > 0 && (
            <span className="ml-3 text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
              必須未割当: {missingRequired.join("・")}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <SecondaryButton onClick={onBack}>戻る</SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={missingRequired.length > 0}>
            {nextLabel}
          </PrimaryButton>
        </div>
      </div>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="テンプレートとして保存"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setSaveOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={saveTemplate}>保存</PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            現在のマッピング設定を新規テンプレートとして保存します。
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">テンプレート名</label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例: 楽天RMS 2026年版"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </GlassCard>
  );
}
