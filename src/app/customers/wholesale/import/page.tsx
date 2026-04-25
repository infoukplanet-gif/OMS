"use client";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Upload, Download, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportMode = "new" | "update" | "upsert";

type ImportHistory = {
  id: number;
  filename: string;
  rows: number;
  success: number;
  error: number;
  mode: ImportMode;
  user: string;
  at: string;
};

const MODE_LABEL: Record<ImportMode, string> = {
  new: "新規追加のみ",
  update: "既存更新のみ",
  upsert: "新規追加＋既存更新",
};

const initialHistory: ImportHistory[] = [
  { id: 1, filename: "wholesale_april_2026.csv", rows: 58, success: 57, error: 1, mode: "upsert", user: "佐藤 花子", at: "2026-04-22 10:14" },
  { id: 2, filename: "credit_limit_update.csv", rows: 32, success: 32, error: 0, mode: "update", user: "田中 太郎", at: "2026-04-18 15:48" },
  { id: 3, filename: "new_wholesales_q2.csv", rows: 14, success: 14, error: 0, mode: "new", user: "鈴木 一郎", at: "2026-04-10 09:22" },
];

const PREVIEW_HEADERS = ["卸先コード", "卸先名", "卸先名カナ", "担当者", "メール", "電話", "与信限度額", "支払条件", "状態"];
const PREVIEW_SAMPLE: string[][] = [
  ["W-00045", "株式会社みらい商事", "ミライショウジ", "松本 健司", "matsumoto@mirai.co.jp", "03-1234-5678", "5,000,000", "月末締翌月末払", "OK"],
  ["W-00046", "ハーモニー卸売", "ハーモニーオロシウリ", "村上 さくら", "murakami@harmony.jp", "06-2345-6789", "3,000,000", "月末締翌々月10日払", "警告: 与信限度額が前回より20%増"],
  ["W-00047", "東京ファッション物産", "トウキョウファッションブッサン", "中田 慎一", "nakata@tf-bussan.com", "03-3456-7890", "10,000,000", "20日締翌月末払", "OK"],
];

export default function WholesaleImportPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [updateCreditLimit, setUpdateCreditLimit] = useState(true);
  const [updatePaymentTerms, setUpdatePaymentTerms] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function onPick() { inputRef.current?.click(); }
  function onFile(f: File | null) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return toast.show("CSVファイルを選択してください", "error");
    setFile(f);
    toast.show(`「${f.name}」を読み込みました`);
  }

  function handleDownloadTemplate() {
    toast.show("卸先マスタ一括登録テンプレートをダウンロードしました");
  }

  function handleExecute() {
    if (!file) return toast.show("ファイルが選択されていません", "error");
    toast.show(`${file.name} を ${MODE_LABEL[mode]} で取込しました`);
    setFile(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">卸先マスタ一括登録</h1>
          <HelpHint side="bottom">
            CSVファイルから卸先マスタを一括で登録・更新します。{"\n"}
            ①でモードとオプションを決めてから②でファイルを選択し、③のプレビューで内容を確認してから取込を実行してください。{"\n"}
            与信限度額や支払条件のような重要項目は、オプションで明示的に上書きを許可しない限り維持されます。
          </HelpHint>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 shadow-sm"
        >
          <Download className="h-4 w-4" />テンプレートダウンロード
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-800">① 登録モードとオプション</h2>
          <HelpHint>
            登録モードで「新規追加のみ」「既存更新のみ」「両方」のどれを行うかを決めます。{"\n"}
            既存卸先の与信枠を誤って書き換える事故を防ぐため、ファイル選択前にここで意図を確定してください。
          </HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {(Object.keys(MODE_LABEL) as ImportMode[]).map((m) => (
            <div key={m} className="relative">
              <button
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "w-full p-3 pr-8 rounded-xl text-sm text-left border transition-all",
                  mode === m
                    ? "bg-blue-500/10 border-blue-400/60 ring-2 ring-blue-500/30"
                    : "bg-white/60 border-white/60 hover:bg-white/80"
                )}
              >
                <div className="font-medium text-gray-800">{MODE_LABEL[m]}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {m === "new" && "既存卸先はスキップ"}
                  {m === "update" && "新規卸先はエラー"}
                  {m === "upsert" && "推奨設定"}
                </div>
              </button>
              <span className="absolute top-2 right-2">
                <HelpHint side="top">
                  {m === "new" && "CSV内の卸先コードのうち、既存マスタに無いものだけを新規追加します。\n既存卸先に該当する行はスキップされ、与信や支払条件は守られます。"}
                  {m === "update" && "CSV内の卸先コードのうち、既存マスタにあるものだけを更新します。\nマスタに無いコードがCSVに含まれているとエラー扱いになります。"}
                  {m === "upsert" && "既存卸先は更新、新規卸先は追加します。\n月次のマスタ整備や年度切替時に推奨される標準オプションです。"}
                </HelpHint>
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={skipFirstRow} onChange={(e) => setSkipFirstRow(e.target.checked)} className="rounded" />
            <span className="text-gray-700">1行目をヘッダー行として扱う</span>
            <HelpHint side="right">
              ONの場合、CSVの1行目を列名として読み込み、データ取込からは除外します。{"\n"}
              テンプレートをダウンロードしたまま使う通常運用ではONのままにしてください。
            </HelpHint>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updateCreditLimit} onChange={(e) => setUpdateCreditLimit(e.target.checked)} className="rounded" />
            <span className="text-gray-700">与信限度額を上書き更新する</span>
            <HelpHint side="right">
              OFFの場合、CSVに与信限度額列が含まれていてもマスタ側の与信枠は維持されます。{"\n"}
              与信は別ワークフロー（与信審査）で管理しているケースではOFFを推奨します。
            </HelpHint>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updatePaymentTerms} onChange={(e) => setUpdatePaymentTerms(e.target.checked)} className="rounded" />
            <span className="text-gray-700">支払条件を上書き更新する</span>
            <HelpHint side="right">
              OFFの場合、CSVに支払条件列が含まれていてもマスタ側の支払条件は維持されます。{"\n"}
              支払条件の変更は債権管理に影響するため、デフォルトはOFFです。
            </HelpHint>
          </label>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-800">② CSVファイル選択</h2>
          <HelpHint>
            CSV / Excel(.csv) のファイルをドラッグ＆ドロップまたはクリックで選択します。{"\n"}
            UTF-8 / Shift-JIS のどちらにも対応。1ファイルあたり最大1,000行を推奨します。
          </HelpHint>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={onPick}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
            dragOver ? "border-blue-400 bg-blue-50/40" : "border-gray-300/50 bg-white/30 hover:bg-white/50"
          )}
        >
          {file ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-base font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />選択を解除
              </button>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-base font-medium text-gray-700">CSVファイルをドラッグ＆ドロップ</p>
              <p className="text-xs text-gray-500">またはクリックしてファイルを選択（UTF-8 / Shift-JIS 対応）</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </GlassCard>

      {file && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">③ プレビュー（先頭3行）</h2>
              <HelpHint>
                ファイルの先頭3行を表示し、列の対応や警告（与信枠の急増など）を確認できます。{"\n"}
                内容に問題がなければ「取込を実行」を押してください。
              </HelpHint>
            </div>
            <span className="text-xs text-gray-500">読み込み済み: 58行</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/60 text-gray-600">
                  {PREVIEW_HEADERS.map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_SAMPLE.map((row, i) => (
                  <tr key={i} className="border-b border-white/40 text-gray-700">
                    {row.map((cell, j) => (
                      <td key={j} className={cn("py-2 px-2 whitespace-nowrap", cell.startsWith("警告") && "text-amber-600 font-medium")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50/60 border border-amber-200/50 rounded-lg p-2">
            <AlertCircle className="h-3.5 w-3.5" />
            1件の警告: 与信限度額が前回より20%以上増加している卸先があります
          </div>
        </GlassCard>
      )}

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={() => setFile(null)}>キャンセル</SecondaryButton>
        <PrimaryButton onClick={handleExecute}>取込を実行</PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
            <HelpHint>
              過去に実行された卸先マスタ取込の一覧です。{"\n"}
              「詳細」からエラー行の確認や差分の参照が行えます。
            </HelpHint>
          </div>
          <span className="text-xs text-gray-500">直近10件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">ファイル名</th>
                <th className="text-left py-2 px-2 font-medium">モード</th>
                <th className="text-right py-2 px-2 font-medium">行数</th>
                <th className="text-right py-2 px-2 font-medium">成功</th>
                <th className="text-right py-2 px-2 font-medium">エラー</th>
                <th className="text-left py-2 px-2 font-medium">実行者</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {initialHistory.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{h.at}</td>
                  <td className="py-2 px-2 text-gray-800">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />{h.filename}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-700">{MODE_LABEL[h.mode]}</td>
                  <td className="py-2 px-2 text-right text-gray-700 tabular-nums">{h.rows}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 tabular-nums">{h.success}</td>
                  <td className={cn("py-2 px-2 text-right tabular-nums", h.error > 0 ? "text-red-600" : "text-gray-400")}>{h.error}</td>
                  <td className="py-2 px-2 text-gray-700">{h.user}</td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => toast.show(`${h.filename} の詳細を表示`, "info")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      詳細
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
