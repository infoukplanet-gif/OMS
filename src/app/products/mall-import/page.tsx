"use client";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Upload, Download, Store, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Mall = {
  key: string;
  label: string;
  icon: string;
  hasTemplate: boolean;
  note: string;
};

const MALLS: Mall[] = [
  { key: "rakuten", label: "楽天市場", icon: "🛍️", hasTemplate: true, note: "item.csv / select.csv 形式対応" },
  { key: "yahoo", label: "Yahoo!ショッピング", icon: "🛒", hasTemplate: true, note: "ストアクリエイターPro CSV対応" },
  { key: "amazon", label: "Amazon", icon: "📦", hasTemplate: true, note: "在庫ファイルテンプレート対応" },
  { key: "makeshop", label: "makeshop", icon: "🏪", hasTemplate: true, note: "商品一括CSV対応" },
  { key: "shopify", label: "Shopify", icon: "🛒", hasTemplate: true, note: "Products CSV対応" },
  { key: "base", label: "BASE", icon: "🏬", hasTemplate: false, note: "APIから自動取得可" },
  { key: "stores", label: "STORES", icon: "🏢", hasTemplate: false, note: "APIから自動取得可" },
  { key: "colorme", label: "カラーミーショップ", icon: "🎨", hasTemplate: true, note: "商品CSV対応" },
];

type ImportHistory = {
  id: number;
  mall: string;
  filename: string;
  rows: number;
  success: number;
  error: number;
  at: string;
};

const initialHistory: ImportHistory[] = [
  { id: 1, mall: "楽天市場", filename: "item_20260423.csv", rows: 512, success: 508, error: 4, at: "2026-04-23 17:05" },
  { id: 2, mall: "Amazon", filename: "Inventory_Template.txt", rows: 230, success: 230, error: 0, at: "2026-04-22 10:12" },
  { id: 3, mall: "Shopify", filename: "products_export_1.csv", rows: 145, success: 144, error: 1, at: "2026-04-19 14:33" },
];

export default function MallImportPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedMall, setSelectedMall] = useState<string>("rakuten");
  const [file, setFile] = useState<File | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "overwrite" | "merge">("merge");
  const [autoMapSku, setAutoMapSku] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const mall = MALLS.find((m) => m.key === selectedMall)!;

  function onPick() { inputRef.current?.click(); }
  function onFile(f: File | null) {
    if (!f) return;
    setFile(f);
    toast.show(`「${f.name}」を読み込みました`);
  }

  function handleTemplate() {
    toast.show(`${mall.label} のテンプレートをダウンロードしました`);
  }

  function handleExecute() {
    if (!file) return toast.show("ファイルが選択されていません", "error");
    toast.show(`${mall.label} へ ${file.name} を取込しました`);
    setFile(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">モール商品一括登録</h1>
        <button
          type="button"
          onClick={handleTemplate}
          disabled={!mall.hasTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />{mall.label}のテンプレート
        </button>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">① モールを選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MALLS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMall(m.key)}
              className={cn(
                "p-3 rounded-xl text-left border transition-all",
                selectedMall === m.key
                  ? "bg-blue-500/10 border-blue-400/60 ring-2 ring-blue-500/30"
                  : "bg-white/60 border-white/60 hover:bg-white/80"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{m.icon}</span>
                <span className="font-medium text-sm text-gray-800">{m.label}</span>
              </div>
              <div className="text-xs text-gray-500">{m.note}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">② ファイル選択</h2>
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
              <p className="text-base font-medium text-gray-700">{mall.label} の商品CSVをドロップ</p>
              <p className="text-xs text-gray-500">またはクリックしてファイルを選択</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">③ 重複時の動作</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "skip", label: "スキップ", desc: "既存は変更しない" },
            { key: "overwrite", label: "上書き", desc: "モール側の情報で置換" },
            { key: "merge", label: "マージ", desc: "空欄のみ埋める" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDuplicateAction(opt.key as typeof duplicateAction)}
              className={cn(
                "p-3 rounded-xl text-sm text-left border transition-all",
                duplicateAction === opt.key
                  ? "bg-blue-500/10 border-blue-400/60 ring-2 ring-blue-500/30"
                  : "bg-white/60 border-white/60 hover:bg-white/80"
              )}
            >
              <div className="font-medium text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input type="checkbox" checked={autoMapSku} onChange={(e) => setAutoMapSku(e.target.checked)} className="rounded" />
          <span className="text-gray-700">モール商品コードをSKUへ自動マッピング</span>
        </label>
      </GlassCard>

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={() => setFile(null)}>キャンセル</SecondaryButton>
        <PrimaryButton onClick={handleExecute}>取込を実行</PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">モール</th>
                <th className="text-left py-2 px-2 font-medium">ファイル名</th>
                <th className="text-right py-2 px-2 font-medium">行数</th>
                <th className="text-right py-2 px-2 font-medium">成功</th>
                <th className="text-right py-2 px-2 font-medium">エラー</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {initialHistory.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{h.at}</td>
                  <td className="py-2 px-2 text-gray-800 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-gray-400" />{h.mall}
                  </td>
                  <td className="py-2 px-2 text-gray-700">{h.filename}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{h.rows}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{h.success}</td>
                  <td className={cn("py-2 px-2 text-right", h.error > 0 ? "text-red-600" : "text-gray-400")}>{h.error}</td>
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
