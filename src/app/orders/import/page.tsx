"use client";

import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Upload, FileSpreadsheet, Check, AlertCircle, Eye, X, FileText } from "lucide-react";

const steps = [
  { label: "ファイルアップロード", value: 1 },
  { label: "マッピング設定", value: 2 },
  { label: "バリデーション", value: 3 },
  { label: "プレビュー・確定", value: 4 },
];

const initialTemplates = ["楽天CSV用", "Amazon用", "卸先A用"];

const mappingRows = [
  { csv: "商品名", sample: "ワイヤレスイヤホン Pro", system: "商品名", matched: true },
  { csv: "商品コード", sample: "WEP-001", system: "商品コード(SKU)", matched: true },
  { csv: "単価(税込)", sample: "14,080", system: "販売価格", matched: true, transform: "税抜計算" },
  { csv: "数量", sample: "3", system: "数量", matched: true },
  { csv: "カテゴリ", sample: "オーディオ", system: "", matched: false },
  { csv: "備考", sample: "ギフト包装希望", system: "スキップ（取り込まない）", matched: false },
];

const systemFields = [
  "商品名",
  "商品コード(SKU)",
  "販売価格",
  "数量",
  "顧客名",
  "メールアドレス",
  "電話番号",
  "郵便番号",
  "住所",
  "カテゴリ",
  "備考",
  "配送方法",
  "支払方法",
  "スキップ（取り込まない）",
];

type PreviewRow = {
  row: number;
  productName: string;
  skuCode: string;
  price: number;
  quantity: number;
  status: "ok" | "warning" | "error";
  warning?: string;
  error?: string;
};

const previewData: PreviewRow[] = [
  { row: 1, productName: "ワイヤレスイヤホン Pro", skuCode: "WEP-001", price: 12800, quantity: 3, status: "ok" },
  { row: 2, productName: "USB-Cケーブル 2m", skuCode: "UCB-002", price: 1280, quantity: 5, status: "ok" },
  { row: 3, productName: "モバイルバッテリー", skuCode: "MBT-004", price: 4980, quantity: 2, status: "ok" },
  { row: 4, productName: "保護フィルム", skuCode: "PFS-005", price: 1580, quantity: 10, status: "warning", warning: "在庫不足の可能性" },
  { row: 5, productName: "急速充電器 65W", skuCode: "CHG-007", price: 3480, quantity: 1, status: "ok" },
  { row: 6, productName: "", skuCode: "WEP-002", price: 0, quantity: 1, status: "error", error: "商品名が空" },
  { row: 7, productName: "Bluetoothスピーカー", skuCode: "BTS-008", price: 7000, quantity: 4, status: "ok" },
];

type OrderImportHistory = {
  id: number;
  filename: string;
  rows: number;
  success: number;
  warning: number;
  error: number;
  template: string;
  user: string;
  at: string;
};

const initialOrderHistory: OrderImportHistory[] = [
  { id: 1, filename: "rakuten_orders_20260424.csv", rows: 187, success: 184, warning: 2, error: 1, template: "楽天CSV用", user: "佐藤 花子", at: "2026-04-24 18:05" },
  { id: 2, filename: "amazon_orders_20260423.csv", rows: 92, success: 92, warning: 0, error: 0, template: "Amazon用", user: "田中 太郎", at: "2026-04-23 17:32" },
  { id: 3, filename: "wholesale_a_april.xlsx", rows: 45, success: 43, warning: 1, error: 1, template: "卸先A用", user: "鈴木 一郎", at: "2026-04-22 11:18" },
];

export default function ImportPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [filter, setFilter] = useState<"all" | "ok" | "warning" | "error">("all");

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const [templates, setTemplates] = useState<string[]>(initialTemplates);
  const [templateKey, setTemplateKey] = useState<string>(initialTemplates[0]);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const counts = {
    all: previewData.length,
    ok: previewData.filter((d) => d.status === "ok").length,
    warning: previewData.filter((d) => d.status === "warning").length,
    error: previewData.filter((d) => d.status === "error").length,
  };

  const filtered = previewData.filter((d) => filter === "all" || d.status === filter);

  function chooseFile() {
    fileInputRef.current?.click();
  }
  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(csv|xlsx|xls|json)$/i.test(f.name)) {
      toast.show("CSV / Excel / JSON 形式のファイルを選択してください", "error");
      return;
    }
    setFileName(f.name);
    setFileSize(f.size);
    toast.show(`${f.name} を読み込みました`);
  }
  function clearFile() {
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function goMapping() {
    if (!fileName) return toast.show("ファイルを選択してください", "error");
    setStep(2);
  }

  function saveTemplate() {
    const name = saveName.trim();
    if (!name) return toast.show("テンプレート名を入力してください", "error");
    if (templates.includes(name)) return toast.show(`「${name}」は既に存在します`, "error");
    setTemplates((prev) => [...prev, name]);
    setTemplateKey(name);
    setSaveName("");
    setSaveOpen(false);
    toast.show(`テンプレート「${name}」を保存しました`);
  }

  function confirmImport() {
    const n = counts.ok + counts.warning;
    toast.show(`${n} 件をインポートしました`);
    setStep(1);
    clearFile();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!/\.(csv|xlsx|xls|json)$/i.test(f.name)) {
      toast.show("CSV / Excel / JSON 形式のファイルを選択してください", "error");
      return;
    }
    setFileName(f.name);
    setFileSize(f.size);
    toast.show(`${f.name} を読み込みました`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800">受注一括登録</h1>
        <HelpHint side="bottom">
          外部CSV / Excel / JSONの受注データをマッピングしてシステムに取り込みます。{"\n"}
          ①ファイルアップロード → ②CSV列とシステム項目のマッピング → ③バリデーション → ④プレビューの順で進めます。{"\n"}
          マッピング設定はテンプレートとして保存でき、次回以降ワンクリックで再利用できます。
        </HelpHint>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.value} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (s.value > 1 && !fileName) {
                  toast.show("先にファイルを選択してください", "error");
                  return;
                }
                setStep(s.value);
              }}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={onFilePicked}
            className="hidden"
          />
          {!fileName ? (
            <div
              onClick={chooseFile}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed border-gray-300/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer"
            >
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-base font-medium text-gray-700">ファイルをドラッグ＆ドロップ</p>
              <p className="text-sm text-gray-500">CSV、Excel (.xlsx)、JSON に対応</p>
              <button type="button" onClick={(e) => { e.stopPropagation(); chooseFile(); }} className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
                ファイルを選択
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
                <p className="text-xs text-gray-500">{fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : ""}</p>
              </div>
              <button type="button" onClick={clearFile} aria-label="ファイルを解除" className="p-1.5 rounded-lg hover:bg-white/60 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <PrimaryButton onClick={goMapping} disabled={!fileName}>次へ: マッピング設定</PrimaryButton>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">テンプレート:</label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {templates.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <HelpHint side="right">
                マッピング設定の組み合わせを名前付きで保存・再利用できます。{"\n"}
                取込元（楽天 / Amazon / 各卸先）ごとに作っておくと次回からワンクリックで切替可能です。
              </HelpHint>
            </div>
            <SecondaryButton onClick={() => setSaveOpen(true)}>新規テンプレートとして保存</SecondaryButton>
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
                  <tr key={row.csv} className={cn("border-t border-white/30 transition-colors", !row.matched && !row.system && "bg-yellow-500/5")}>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.csv}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{row.sample}</td>
                    <td className="px-2 py-3 text-center text-gray-300">→</td>
                    <td className="px-4 py-3">
                      <select defaultValue={row.system || ""} className="h-8 px-2 rounded-lg text-sm w-full bg-white/50 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20">
                        <option value="">未選択</option>
                        {systemFields.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      {row.transform && <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-700">⚙ {row.transform}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.matched ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" />自動マッチ</span>
                      : !row.system ? <span className="inline-flex items-center gap-1 text-xs text-yellow-600"><AlertCircle className="h-3.5 w-3.5" />未設定</span>
                      : <span className="text-xs text-gray-400">スキップ</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500"><FileSpreadsheet className="h-4 w-4 inline mr-1" />{fileName} — 123 件のデータを読み込み済み</p>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setStep(1)}>戻る</SecondaryButton>
              <PrimaryButton onClick={() => setStep(3)}>次へ: バリデーション</PrimaryButton>
            </div>
          </div>
        </GlassCard>
      )}

      {step === 3 && (
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
          <p className="text-sm text-gray-500 mb-3">エラー行は修正するか除外してから次に進んでください。</p>
          <div className="flex justify-between">
            <SecondaryButton onClick={() => setStep(2)}>戻る</SecondaryButton>
            <PrimaryButton onClick={() => setStep(4)}>次へ: プレビュー</PrimaryButton>
          </div>
        </GlassCard>
      )}

      {step === 4 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Eye className="h-4 w-4 text-gray-400" />インポートプレビュー</h2>
              <HelpHint>
                取込確定後にシステムにどう反映されるかを行単位で確認できます。{"\n"}
                警告タブで在庫不足など注意行を、エラータブで除外される行を絞り込み表示できます。
              </HelpHint>
            </div>
            <p className="text-xs text-gray-500">確定前にどのように反映されるかを確認できます</p>
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
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
                    <td className="px-3 py-2.5 text-gray-800">{d.productName || <span className="text-red-500 italic">未入力</span>}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{d.skuCode}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">¥{d.price.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700 tabular-nums">{d.quantity}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-800 tabular-nums">¥{(d.price * d.quantity).toLocaleString()}</td>
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
              <span className="font-bold text-blue-700">{counts.ok + counts.warning}件</span>のデータがインポートされます。
              {counts.error > 0 && <span className="text-red-600 ml-2">エラー{counts.error}件はスキップされます。</span>}
            </p>
          </div>

          <div className="flex justify-between mt-4">
            <SecondaryButton onClick={() => setStep(3)}>戻る</SecondaryButton>
            <PrimaryButton onClick={confirmImport}>インポート確定</PrimaryButton>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
            <HelpHint>
              過去に実行された受注取込の一覧です。{"\n"}
              「詳細」からエラー行の確認や同じテンプレートでの再実行が行えます。
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
                <th className="text-right py-2 px-2 font-medium">行数</th>
                <th className="text-right py-2 px-2 font-medium">成功</th>
                <th className="text-right py-2 px-2 font-medium">警告</th>
                <th className="text-right py-2 px-2 font-medium">エラー</th>
                <th className="text-left py-2 px-2 font-medium">実行者</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {initialOrderHistory.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{h.at}</td>
                  <td className="py-2 px-2 text-gray-800">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />{h.filename}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-700">{h.template}</td>
                  <td className="py-2 px-2 text-right text-gray-700 tabular-nums">{h.rows}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 tabular-nums">{h.success}</td>
                  <td className={cn("py-2 px-2 text-right tabular-nums", h.warning > 0 ? "text-yellow-700" : "text-gray-400")}>{h.warning}</td>
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
          <p className="text-sm text-gray-700">現在のマッピング設定を新規テンプレートとして保存します。</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">テンプレート名</label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例: 楽天CSV 2026年版"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
