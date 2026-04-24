"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { PrimaryButton, useToast } from "@/components/ui/interactive";
import { FileDown, CheckSquare, Square } from "lucide-react";

type Field = { key: string; label: string; group: string };

const FIELDS: Field[] = [
  { key: "sku", label: "商品コード", group: "基本" },
  { key: "name", label: "商品名", group: "基本" },
  { key: "name_kana", label: "商品名カナ", group: "基本" },
  { key: "jan", label: "JANコード", group: "基本" },
  { key: "maker_code", label: "メーカー品番", group: "基本" },
  { key: "category", label: "カテゴリ", group: "基本" },
  { key: "brand", label: "ブランド", group: "基本" },
  { key: "cost", label: "原価", group: "価格" },
  { key: "price", label: "販売価格", group: "価格" },
  { key: "tax_rate", label: "税率", group: "価格" },
  { key: "member_price", label: "会員価格", group: "価格" },
  { key: "wholesale_price", label: "卸価格", group: "価格" },
  { key: "stock", label: "在庫数", group: "在庫" },
  { key: "safe_stock", label: "安全在庫", group: "在庫" },
  { key: "warehouse", label: "保管倉庫", group: "在庫" },
  { key: "location", label: "棚番", group: "在庫" },
  { key: "weight", label: "重量", group: "物流" },
  { key: "size", label: "サイズ", group: "物流" },
  { key: "delivery", label: "納期区分", group: "物流" },
  { key: "supplier", label: "仕入先", group: "物流" },
  { key: "description", label: "商品説明", group: "モール" },
  { key: "image_url", label: "画像URL", group: "モール" },
  { key: "tags", label: "タグ", group: "モール" },
  { key: "status", label: "販売状態", group: "モール" },
];

type DownloadHistory = {
  id: number;
  filename: string;
  count: number;
  format: string;
  user: string;
  at: string;
};

const initialHistory: DownloadHistory[] = [
  { id: 1, filename: "products_20260423.csv", count: 1842, format: "CSV (UTF-8)", user: "佐藤 花子", at: "2026-04-23 11:22" },
  { id: 2, filename: "products_rakuten.xlsx", count: 820, format: "Excel", user: "田中 太郎", at: "2026-04-18 09:30" },
];

export default function MasterDownloadPage() {
  const toast = useToast();
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [status, setStatus] = useState("all");
  const [format, setFormat] = useState("csv_utf8");
  const [selected, setSelected] = useState<Set<string>>(new Set(FIELDS.map((f) => f.key)));

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleGroup(group: string) {
    const keys = FIELDS.filter((f) => f.group === group).map((f) => f.key);
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => { if (allOn) next.delete(k); else next.add(k); });
      return next;
    });
  }

  function handleDownload() {
    if (selected.size === 0) return toast.show("項目を1つ以上選択してください", "error");
    toast.show(`${selected.size}項目を ${format.toUpperCase()} でダウンロードしました`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">商品マスタ全件ダウンロード</h1>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">抽出条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">登録日（開始）</label>
            <DatePicker value={from} onChange={setFrom} placeholder="開始日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">登録日（終了）</label>
            <DatePicker value={to} onChange={setTo} placeholder="終了日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">販売状態</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="all">すべて</option>
              <option value="active">販売中</option>
              <option value="pause">休止中</option>
              <option value="end">販売終了</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">出力形式</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
            >
              <option value="csv_utf8">CSV (UTF-8)</option>
              <option value="csv_sjis">CSV (Shift-JIS)</option>
              <option value="xlsx">Excel</option>
              <option value="tsv">TSV</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">出力項目の選択</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set(FIELDS.map((f) => f.key)))}
              className="text-xs text-blue-600 hover:underline"
            >
              全選択
            </button>
            <span className="text-xs text-gray-400">|</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-500 hover:underline"
            >
              全解除
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {groups.map((group) => {
            const groupFields = FIELDS.filter((f) => f.group === group);
            const allOn = groupFields.every((f) => selected.has(f.key));
            return (
              <div key={group}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 mb-2"
                >
                  {allOn ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> : <Square className="h-3.5 w-3.5" />}
                  {group}
                </button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 ml-5">
                  {groupFields.map((f) => (
                    <label key={f.key} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-white/50 rounded px-2 py-1 transition-colors">
                      <input
                        type="checkbox"
                        checked={selected.has(f.key)}
                        onChange={() => toggle(f.key)}
                        className="rounded"
                      />
                      <span className="text-gray-700">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-between">
          <span className="text-xs text-gray-600">選択中: <span className="font-semibold text-gray-900">{selected.size}</span> / {FIELDS.length} 項目</span>
          <PrimaryButton onClick={handleDownload}>
            <FileDown className="h-4 w-4" />ダウンロード
          </PrimaryButton>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">ダウンロード履歴</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">ファイル名</th>
                <th className="text-right py-2 px-2 font-medium">件数</th>
                <th className="text-left py-2 px-2 font-medium">形式</th>
                <th className="text-left py-2 px-2 font-medium">実行者</th>
              </tr>
            </thead>
            <tbody>
              {initialHistory.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{h.at}</td>
                  <td className="py-2 px-2 text-gray-800">{h.filename}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{h.count}</td>
                  <td className="py-2 px-2 text-gray-700">{h.format}</td>
                  <td className="py-2 px-2 text-gray-700">{h.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
