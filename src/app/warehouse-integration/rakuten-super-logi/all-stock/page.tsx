"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { AlertCircle, Download, RefreshCw, Search } from "lucide-react";

type Stock = {
  sku: string;
  rslSku: string;
  name: string;
  category: string;
  available: number;
  allocated: number;
  inbound: number;
  defective: number;
  total: number;
  location: string;
  lastUpdated: string;
};

const data: Stock[] = [
  { sku: "P-001", rslSku: "RSL-OMS-001-WH-M", name: "コットンTシャツ ホワイト M", category: "アパレル", available: 1240, allocated: 88, inbound: 200, defective: 4, total: 1532, location: "A-01-12", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-001-L", rslSku: "RSL-OMS-001-WH-L", name: "コットンTシャツ ホワイト L", category: "アパレル", available: 980, allocated: 65, inbound: 150, defective: 2, total: 1197, location: "A-01-13", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-002", rslSku: "RSL-OMS-002-DM-M", name: "デニムジャケット M", category: "アパレル", available: 320, allocated: 24, inbound: 0, defective: 8, total: 352, location: "A-02-05", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-003", rslSku: "RSL-OMS-003-350", name: "ステンレスタンブラー 350ml", category: "雑貨", available: 1820, allocated: 42, inbound: 500, defective: 0, total: 2362, location: "B-03-08", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-004", rslSku: "RSL-OMS-004", name: "オーガニックコーヒー豆", category: "食品", available: 450, allocated: 18, inbound: 200, defective: 0, total: 668, location: "C-01-02", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-005", rslSku: "RSL-OMS-005", name: "ナチュラルコスメセット", category: "コスメ", available: 88, allocated: 12, inbound: 100, defective: 1, total: 201, location: "D-02-01", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-007", rslSku: "RSL-OMS-007", name: "革製キーケース", category: "雑貨", available: 4, allocated: 2, inbound: 0, defective: 0, total: 6, location: "B-05-12", lastUpdated: "2026/04/30 10:30" },
  { sku: "P-008", rslSku: "RSL-OMS-008", name: "ストーンウェアマグ", category: "雑貨", available: 0, allocated: 0, inbound: 200, defective: 0, total: 200, location: "—", lastUpdated: "2026/04/30 10:30" },
];

const categories = Array.from(new Set(data.map((d) => d.category)));

export default function RsrLogiAllStockPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data.filter((d) => {
      if (k && !`${d.sku} ${d.rslSku} ${d.name}`.toLowerCase().includes(k)) return false;
      if (category !== "all" && d.category !== category) return false;
      if (lowStockOnly && d.available > 50) return false;
      return true;
    });
  }, [keyword, category, lowStockOnly]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 全在庫情報</h1>
            <HelpHint>RSL倉庫の最新在庫数。利用可能・引当済・入荷予定・不良品をSKU別に確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">RSL倉庫の現在在庫をリアルタイム取得。低在庫アラートと棚ロケーションも確認できます。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => toast.show("RSL在庫を再同期しました", "success")}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4" />再同期</span>
          </SecondaryButton>
          <SecondaryButton onClick={() => toast.show("在庫CSVを書き出しました", "success")}>
            <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />CSV</span>
          </SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">SKU総数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{data.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">利用可能在庫</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.reduce((s, d) => s + d.available, 0).toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">引当済</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data.reduce((s, d) => s + d.allocated, 0).toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">入荷予定</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{data.reduce((s, d) => s + d.inbound, 0).toLocaleString()}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="商品コード・RSL SKU・商品名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-white/60 text-sm cursor-pointer">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="accent-blue-500" />
            低在庫のみ（≦50）
          </label>
          <SecondaryButton onClick={() => { setKeyword(""); setCategory("all"); setLowStockOnly(false); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {data.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">RSL SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">カテゴリ</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">利用可能</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">引当済</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入荷予定</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">不良</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">合計</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ロケ</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終更新</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.sku} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{d.sku}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.rslSku}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{d.name}</td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">{d.category}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium inline-flex items-center justify-end gap-1", d.available <= 10 ? "text-red-600" : d.available <= 50 ? "text-amber-600" : "text-emerald-600")}>
                  {d.available <= 10 && <AlertCircle className="h-3 w-3" />}
                  {d.available.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{d.allocated.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-violet-700">{d.inbound.toLocaleString()}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums text-xs", d.defective > 0 ? "text-rose-600" : "text-gray-400")}>{d.defective}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800 font-medium">{d.total.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.location}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{d.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
