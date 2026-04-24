"use client";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
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
  { id: 1, filename: "spring_2026_products.csv", rows: 245, success: 243, error: 2, mode: "upsert", user: "佐藤 花子", at: "2026-04-23 14:32" },
  { id: 2, filename: "amazon_delta.csv", rows: 82, success: 82, error: 0, mode: "update", user: "田中 太郎", at: "2026-04-20 09:15" },
  { id: 3, filename: "new_arrivals.csv", rows: 120, success: 118, error: 2, mode: "new", user: "鈴木 一郎", at: "2026-04-15 16:42" },
];

const PREVIEW_HEADERS = ["商品コード", "商品名", "JANコード", "原価", "販売価格", "在庫数", "カテゴリ", "状態"];
const PREVIEW_SAMPLE: string[][] = [
  ["SKU-00012", "オーガニックコットンT 黒 M", "4580123456789", "1200", "2980", "48", "トップス", "OK"],
  ["SKU-00013", "オーガニックコットンT 黒 L", "4580123456790", "1200", "2980", "0", "トップス", "警告: 在庫0"],
  ["SKU-00014", "リネンシャツ 白 M", "4580123456801", "2200", "4980", "32", "トップス", "OK"],
];

export default function ProductImportPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [updateStock, setUpdateStock] = useState(true);
  const [updatePrice, setUpdatePrice] = useState(true);
  const [dragOver, setDragOver] = useState(false);

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

  function handleExecute() {
    if (!file) return toast.show("ファイルが選択されていません", "error");
    toast.show(`${file.name} を ${MODE_LABEL[mode]} で取込しました`);
    setFile(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">商品一括登録</h1>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 shadow-sm"
        >
          <Download className="h-4 w-4" />テンプレートダウンロード
        </button>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">① CSVファイル選択</h2>
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

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">② 登録モードとオプション</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {(Object.keys(MODE_LABEL) as ImportMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "p-3 rounded-xl text-sm text-left border transition-all",
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
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={skipFirstRow} onChange={(e) => setSkipFirstRow(e.target.checked)} className="rounded" />
            <span className="text-gray-700">1行目をヘッダー行として扱う</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updateStock} onChange={(e) => setUpdateStock(e.target.checked)} className="rounded" />
            <span className="text-gray-700">在庫数を上書き更新する</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={updatePrice} onChange={(e) => setUpdatePrice(e.target.checked)} className="rounded" />
            <span className="text-gray-700">販売価格を上書き更新する</span>
          </label>
        </div>
      </GlassCard>

      {file && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">③ プレビュー（先頭3行）</h2>
            <span className="text-xs text-gray-500">読み込み済み: 245行</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/60 text-gray-600">
                  {PREVIEW_HEADERS.map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_SAMPLE.map((row, i) => (
                  <tr key={i} className="border-b border-white/40 text-gray-700">
                    {row.map((cell, j) => (
                      <td key={j} className={cn("py-2 px-2", cell.startsWith("警告") && "text-amber-600 font-medium")}>
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
            2件の警告: 在庫数0のSKUが含まれています
          </div>
        </GlassCard>
      )}

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={() => setFile(null)}>キャンセル</SecondaryButton>
        <PrimaryButton onClick={handleExecute}>取込を実行</PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
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
                  <td className="py-2 px-2 text-gray-800 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />{h.filename}
                  </td>
                  <td className="py-2 px-2 text-gray-700">{MODE_LABEL[h.mode]}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{h.rows}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{h.success}</td>
                  <td className={cn("py-2 px-2 text-right", h.error > 0 ? "text-red-600" : "text-gray-400")}>{h.error}</td>
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
