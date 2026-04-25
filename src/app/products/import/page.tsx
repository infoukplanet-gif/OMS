"use client";

import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { ImportMappingStep, type MappingRow } from "@/components/import/import-mapping-step";
import { Upload, Download, FileText, FileSpreadsheet, CheckCircle2, Check, AlertCircle, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportMode = "new" | "update" | "upsert";

type ImportHistory = {
  id: number;
  filename: string;
  rows: number;
  success: number;
  error: number;
  mode: ImportMode;
  template: string;
  user: string;
  at: string;
};

const MODE_LABEL: Record<ImportMode, string> = {
  new: "新規追加のみ",
  update: "既存更新のみ",
  upsert: "新規追加＋既存更新",
};

const steps = [
  { label: "登録モード", value: 1 },
  { label: "ファイルアップロード", value: 2 },
  { label: "マッピング設定", value: 3 },
  { label: "バリデーション", value: 4 },
  { label: "プレビュー・確定", value: 5 },
];

const initialTemplates = ["楽天RMS用", "Amazon SP-API用", "Shopify用", "自社EDI用"];

const initialMappingRows: MappingRow[] = [
  { csv: "商品管理番号", sample: "SKU-00012", system: "商品コード(SKU)", matched: true },
  { csv: "商品名", sample: "オーガニックコットンT 黒 M", system: "商品名", matched: true },
  { csv: "商品名（カナ）", sample: "オーガニックコットンティーシャツ", system: "商品名カナ", matched: true },
  { csv: "JAN/EAN", sample: "4580123456789", system: "JANコード", matched: true },
  { csv: "原価", sample: "1200", system: "原価", matched: true },
  { csv: "販売価格(税込)", sample: "2980", system: "販売価格", matched: true, transform: "税抜計算" },
  { csv: "在庫数", sample: "48", system: "在庫数", matched: true },
  { csv: "表示用ジャンルID", sample: "120832", system: "スキップ（取り込まない）", matched: false },
  { csv: "仕入先名", sample: "グリーンファクトリー", system: "", matched: false },
];

const systemFields = [
  "商品コード(SKU)",
  "商品名",
  "商品名カナ",
  "JANコード",
  "原価",
  "販売価格",
  "在庫数",
  "カテゴリ",
  "ブランド",
  "サイズ",
  "カラー",
  "重量",
  "商品説明",
  "状態",
  "スキップ（取り込まない）",
];

type PreviewRow = {
  row: number;
  sku: string;
  name: string;
  jan: string;
  cost: number;
  price: number;
  stock: number;
  status: "ok" | "warning" | "error";
  warning?: string;
  error?: string;
};

const previewData: PreviewRow[] = [
  { row: 1, sku: "SKU-00012", name: "オーガニックコットンT 黒 M", jan: "4580123456789", cost: 1200, price: 2980, stock: 48, status: "ok" },
  { row: 2, sku: "SKU-00013", name: "オーガニックコットンT 黒 L", jan: "4580123456790", cost: 1200, price: 2980, stock: 0, status: "warning", warning: "在庫数が0" },
  { row: 3, sku: "SKU-00014", name: "リネンシャツ 白 M", jan: "4580123456801", cost: 2200, price: 4980, stock: 32, status: "ok" },
  { row: 4, sku: "SKU-00015", name: "リネンシャツ 白 L", jan: "4580123456818", cost: 2200, price: 4980, stock: 18, status: "ok" },
  { row: 5, sku: "", name: "デニムジャケット", jan: "", cost: 3500, price: 8900, stock: 6, status: "error", error: "SKU未入力" },
  { row: 6, sku: "SKU-00017", name: "ニットセーター ベージュ", jan: "4580123456832", cost: 2800, price: 5980, stock: 22, status: "ok" },
];

const initialHistory: ImportHistory[] = [
  { id: 1, filename: "spring_2026_products.csv", rows: 245, success: 243, error: 2, mode: "upsert", template: "自社EDI用", user: "佐藤 花子", at: "2026-04-23 14:32" },
  { id: 2, filename: "amazon_delta.csv", rows: 82, success: 82, error: 0, mode: "update", template: "Amazon SP-API用", user: "田中 太郎", at: "2026-04-20 09:15" },
  { id: 3, filename: "rakuten_new_arrivals.csv", rows: 120, success: 118, error: 2, mode: "new", template: "楽天RMS用", user: "鈴木 一郎", at: "2026-04-15 16:42" },
];

export default function ProductImportPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [filter, setFilter] = useState<"all" | "ok" | "warning" | "error">("all");

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [updateStock, setUpdateStock] = useState(true);
  const [updatePrice, setUpdatePrice] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const [templates, setTemplates] = useState<string[]>(initialTemplates);
  const [templateKey, setTemplateKey] = useState<string>(initialTemplates[0]);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>(initialMappingRows);

  const counts = {
    all: previewData.length,
    ok: previewData.filter((d) => d.status === "ok").length,
    warning: previewData.filter((d) => d.status === "warning").length,
    error: previewData.filter((d) => d.status === "error").length,
  };
  const filtered = previewData.filter((d) => filter === "all" || d.status === filter);

  function onPick() { inputRef.current?.click(); }
  function onFile(f: File | null) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return toast.show("CSVファイルを選択してください", "error");
    setFile(f);
    toast.show(`「${f.name}」を読み込みました`);
  }

  function handleDownloadTemplate() {
    toast.show("商品一括登録テンプレートをダウンロードしました");
  }

  function addTemplate(name: string) {
    setTemplates((prev) => [...prev, name]);
    setTemplateKey(name);
  }

  function handleMappingChange(csv: string, system: string) {
    setMappingRows((prev) =>
      prev.map((r) => (r.csv === csv ? { ...r, system, matched: r.matched && system === r.system } : r))
    );
  }

  function confirmImport() {
    const n = counts.ok + counts.warning;
    toast.show(`${n} 件を ${MODE_LABEL[mode]} で取込しました`);
    setStep(1);
    setFile(null);
  }

  function gotoStep(target: number) {
    if (target >= 2 && !file) return toast.show("先にファイルを選択してください", "error");
    setStep(target);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">商品一括登録</h1>
          <HelpHint side="bottom">
            CSVファイルから商品マスタを一括で登録・更新します。{"\n"}
            ①登録モード → ②ファイル → ③マッピング → ④バリデーション → ⑤プレビューの順で進めます。{"\n"}
            マッピング設定はテンプレートとして保存でき、楽天/Amazon/Shopify/自社EDIなど取込元別に再利用できます。
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

      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.value} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => gotoStep(s.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
                s.value < step ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" :
                s.value === step ? "bg-blue-500/15 text-blue-700 font-medium" :
                "bg-white/40 text-gray-400 hover:bg-white/60"
              )}
            >
              <span className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                s.value < step ? "bg-emerald-500 text-white" :
                s.value === step ? "bg-blue-500 text-white" :
                "bg-gray-200 text-gray-500"
              )}>
                {s.value < step ? <Check className="h-3.5 w-3.5" /> : s.value}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className="w-8 h-px bg-gray-300/50" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-800">登録モードとオプション</h2>
            <HelpHint>
              登録モードで「新規追加のみ」「既存更新のみ」「両方」のどれを行うかを決めます。{"\n"}
              ファイル選択前に決めておくことで、誤って既存マスタを書き換える事故を防げます。
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
                    {m === "new" && "既存SKUはスキップ"}
                    {m === "update" && "新規SKUはエラー"}
                    {m === "upsert" && "推奨設定"}
                  </div>
                </button>
                <span className="absolute top-2 right-2">
                  <HelpHint side="top">
                    {m === "new" && "CSV内のSKUのうち、既存マスタに無いものだけを新規追加します。\n既存SKUに該当する行はスキップされ、上書きされません。"}
                    {m === "update" && "CSV内のSKUのうち、既存マスタにあるものだけを更新します。\n既存マスタに無いSKUがCSVに含まれているとエラー扱いになります。"}
                    {m === "upsert" && "既存SKUは更新、新規SKUは追加します。\nマスタとCSVの差分を一括で反映したい時の標準オプションです。"}
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
              <input type="checkbox" checked={updateStock} onChange={(e) => setUpdateStock(e.target.checked)} className="rounded" />
              <span className="text-gray-700">在庫数を上書き更新する</span>
              <HelpHint side="right">
                OFFの場合、CSVに在庫数が含まれていてもマスタの在庫は維持されます。{"\n"}
                在庫は別ルート（倉庫連携）で管理しているケースではOFFを推奨します。
              </HelpHint>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={updatePrice} onChange={(e) => setUpdatePrice(e.target.checked)} className="rounded" />
              <span className="text-gray-700">販売価格を上書き更新する</span>
              <HelpHint side="right">
                OFFの場合、CSVに販売価格が含まれていてもマスタ側の価格は維持されます。{"\n"}
                モール側の価格を取り込みたくない場合などにOFFにしてください。
              </HelpHint>
            </label>
          </div>
          <div className="flex justify-end mt-4">
            <PrimaryButton onClick={() => setStep(2)}>次へ: ファイル選択</PrimaryButton>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-800">CSVファイル選択</h2>
            <HelpHint>
              CSV / Excel(.csv) のファイルをドラッグ＆ドロップまたはクリックで選択します。{"\n"}
              UTF-8 / Shift-JIS のどちらにも対応。1ファイルあたり最大10,000行を推奨します。
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
          <div className="flex justify-between mt-4">
            <SecondaryButton onClick={() => setStep(1)}>戻る</SecondaryButton>
            <PrimaryButton onClick={() => gotoStep(3)} disabled={!file}>次へ: マッピング設定</PrimaryButton>
          </div>
        </GlassCard>
      )}

      {step === 3 && (
        <ImportMappingStep
          fileName={file?.name ?? ""}
          totalRows={245}
          templates={templates}
          templateKey={templateKey}
          onTemplateChange={setTemplateKey}
          onTemplateAdd={addTemplate}
          systemFields={systemFields}
          mappingRows={mappingRows}
          onMappingChange={handleMappingChange}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          helpText={"楽天RMS / Amazon SP-API / Shopify / 自社EDIなど、取込元ごとに列名が違うCSVを商品マスタの正規項目に紐付けます。\nテンプレート保存しておけば、次回同じ取込元のデータをワンクリックで再利用できます。"}
        />
      )}

      {step === 4 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">バリデーション結果</h2>
            <HelpHint>
              マッピング後のデータを必須項目チェック・型チェックします。{"\n"}
              エラー行は取込から自動的に除外されます。警告行は取り込まれますが、内容を確認してください。
            </HelpHint>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2"><Check className="h-5 w-5 text-emerald-600" /><span className="text-sm text-emerald-700">正常</span></div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{counts.ok}<span className="text-sm font-normal">件</span></p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-yellow-600" /><span className="text-sm text-yellow-700">警告</span></div>
              <p className="mt-2 text-2xl font-bold text-yellow-700">{counts.warning}<span className="text-sm font-normal">件</span></p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /><span className="text-sm text-red-700">エラー</span></div>
              <p className="mt-2 text-2xl font-bold text-red-700">{counts.error}<span className="text-sm font-normal">件</span></p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">エラー行は取込時に自動除外されます。警告行の内容も確認してください。</p>
          <div className="flex justify-between">
            <SecondaryButton onClick={() => setStep(3)}>戻る</SecondaryButton>
            <PrimaryButton onClick={() => setStep(5)}>次へ: プレビュー</PrimaryButton>
          </div>
        </GlassCard>
      )}

      {step === 5 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Eye className="h-4 w-4 text-gray-400" />インポートプレビュー</h2>
              <HelpHint>
                取込確定後にシステムにどう反映されるかを行単位で確認できます。{"\n"}
                警告タブで在庫0など注意行を、エラータブで除外される行を絞り込み表示できます。
              </HelpHint>
            </div>
            <p className="text-xs text-gray-500">{MODE_LABEL[mode]}・{templateKey} で取り込まれます</p>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-white/40 border border-white/50 w-fit mb-4">
            {[
              { v: "all", l: "すべて", n: counts.all, c: "text-gray-700" },
              { v: "ok", l: "正常", n: counts.ok, c: "text-emerald-700" },
              { v: "warning", l: "警告", n: counts.warning, c: "text-yellow-700" },
              { v: "error", l: "エラー", n: counts.error, c: "text-red-700" },
            ].map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => setFilter(t.v as typeof filter)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                  filter === t.v ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.06)] font-medium" : "hover:bg-white/40",
                  t.c
                )}
              >
                {t.l}<span className="px-1.5 py-0.5 rounded bg-white/60 text-[10px]">{t.n}</span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="w-12 px-2 py-2 text-center text-[10px] font-medium text-gray-500">行</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">JAN</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">原価</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">販売価格</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">在庫</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">状態</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.row} className={cn("border-t border-white/30 transition-colors",
                    d.status === "error" ? "bg-red-500/5 hover:bg-red-500/10" :
                    d.status === "warning" ? "bg-yellow-500/5 hover:bg-yellow-500/10" :
                    "hover:bg-white/40"
                  )}>
                    <td className="px-2 py-2.5 text-center text-[10px] text-gray-400">{d.row}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{d.sku || <span className="text-red-500 italic">未入力</span>}</td>
                    <td className="px-3 py-2.5 text-gray-800">{d.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.jan || "—"}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">¥{d.cost.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800 tabular-nums">¥{d.price.toLocaleString()}</td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums", d.stock === 0 ? "text-amber-600 font-medium" : "text-gray-700")}>{d.stock}</td>
                    <td className="px-3 py-2.5 text-center">
                      {d.status === "ok" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700"><Check className="h-3 w-3" />OK</span>}
                      {d.status === "warning" && <span title={d.warning} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-700"><AlertCircle className="h-3 w-3" />警告</span>}
                      {d.status === "error" && <span title={d.error} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700"><AlertCircle className="h-3 w-3" />エラー</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-blue-700">{counts.ok + counts.warning}件</span>のデータを「{MODE_LABEL[mode]}」で取り込みます。
              {counts.error > 0 && <span className="text-red-600 ml-2">エラー{counts.error}件はスキップされます。</span>}
            </p>
          </div>

          <div className="flex justify-between mt-4">
            <SecondaryButton onClick={() => setStep(4)}>戻る</SecondaryButton>
            <PrimaryButton onClick={confirmImport}>取込を実行</PrimaryButton>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
            <HelpHint>
              過去に実行された取込の一覧です。{"\n"}
              「詳細」からエラー行の確認や再実行が行えます。
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
                <th className="text-left py-2 px-2 font-medium">テンプレート</th>
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
                  <td className="py-2 px-2 text-gray-700">{h.template}</td>
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
