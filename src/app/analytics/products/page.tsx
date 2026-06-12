"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/export/csv";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";
import { salesStore, type SalesEntry } from "@/lib/stores/sales";
import { orderStore, type OrderRecord } from "@/lib/stores/orders";
import { productStore } from "@/lib/stores/product";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_PRODUCTS } from "@/lib/seeds/products";
import { SKU_NAMES, SKU_UNIT_COST } from "@/lib/seeds/inventory";
import {
  aggregateProductSales,
  type ProductSalesRow,
  type SalesOrderSource,
} from "@/lib/calculations/aggregate-product-sales";
import type { AllocationLine } from "@/lib/state-machines/inventory";

const EMPTY_LEDGER: readonly SalesEntry[] = [];

type SortKey = "amount" | "qty" | "cost" | "gross" | "grossRate";

const rankBadge: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-700",
  B: "bg-blue-500/15 text-blue-700",
  C: "bg-gray-500/15 text-gray-600",
};

const fmtYmd = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

export default function AnalyticsProductsPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState("all");
  const [shop, setShop] = useState("all");
  const [rank, setRank] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // 確定売上台帳を購読（永続化オーナーは売上分析ページ。ここは閲覧のみ）
  const ledger = useSyncExternalStore(
    salesStore.subscribe,
    salesStore.getState,
    () => EMPTY_LEDGER,
  );

  // 受注（明細按分用）と商品マスタ（カテゴリ解決用）の共有ストアを購読
  useEffect(() => {
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (productStore.getState().length === 0) productStore.setItems(INITIAL_PRODUCTS);
  }, []);

  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS as ReadonlyArray<OrderRecord>,
  );
  const products = useSyncExternalStore(
    (cb) => productStore.subscribe(cb),
    () => productStore.getState(),
    () => INITIAL_PRODUCTS,
  );

  // 期間フィルター: recognizedAt（"YYYY/MM/DD"）をゼロ埋め文字列のまま比較
  const periodEntries = useMemo(() => {
    const fromKey = from ? fmtYmd(from) : "";
    const toKey = to ? fmtYmd(to) : "";
    return ledger.filter((e) => {
      if (fromKey && e.recognizedAt < fromKey) return false;
      if (toKey && e.recognizedAt > toKey) return false;
      return true;
    });
  }, [ledger, from, to]);

  const { rows, skipped } = useMemo(() => {
    const sources: SalesOrderSource[] = orders.map((o) => ({
      id: o.id,
      allocation: (o.allocation ?? []) as AllocationLine[],
    }));
    return aggregateProductSales(periodEntries, sources, {
      names: SKU_NAMES,
      unitCosts: SKU_UNIT_COST,
      categories: Object.fromEntries(products.map((p) => [p.code, p.category])),
    });
  }, [periodEntries, orders, products]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))), [rows]);
  const shops = useMemo(() => Array.from(new Set(rows.map((r) => r.shop))), [rows]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (k && !`${r.sku} ${r.name}`.toLowerCase().includes(k)) return false;
        if (category !== "all" && r.category !== category) return false;
        if (shop !== "all" && r.shop !== shop) return false;
        if (rank !== "all" && r.rank !== rank) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [rows, keyword, category, shop, rank, sortKey, sortDir]);

  const totals = useMemo(() => {
    const amount = filtered.reduce((s, r) => s + r.amount, 0);
    const gross = filtered.reduce((s, r) => s + r.gross, 0);
    return {
      amount,
      qty: filtered.reduce((s, r) => s + r.qty, 0),
      gross,
      grossRate: amount > 0 ? Math.round((gross / amount) * 1000) / 10 : 0,
    };
  }, [filtered]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === "desc" ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowUp className="h-3 w-3 inline" />) : null;

  function clearFilters() {
    setKeyword(""); setFrom(undefined); setTo(undefined);
    setCategory("all"); setShop("all"); setRank("all");
  }

  function handleCsvExport() {
    const headers = ["商品コード", "商品名", "カテゴリ", "店舗", "販売数", "売上金額", "原価", "粗利", "粗利率(%)", "ABCランク"] as const;
    const csvRows = filtered.map((r: ProductSalesRow) => [
      r.sku,
      r.name,
      r.category,
      r.shop,
      r.qty,
      r.amount,
      r.cost,
      r.gross,
      r.grossRate,
      r.rank,
    ] as const);
    downloadCsv(`商品別分析_${new Date().toISOString().slice(0, 10)}`, headers, csvRows);
    toast.show("商品別分析をCSVでダウンロードしました", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">商品別分析</h1>
            <HelpHint>確定売上台帳（出荷確定で計上）を受注明細で按分し、SKU×店舗ごとの売上・粗利・ABCランクを集計します。期間・店舗・カテゴリで絞り込み、CSVに書き出せます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            出荷を確定した売上がここにライブ集計されます。売れ筋・死筋の特定や粗利改善にご利用ください。
          </p>
        </div>
        <SecondaryButton onClick={handleCsvExport}>
          <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />CSV書き出し</span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">合計売上</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">¥{totals.amount.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">合計販売数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{totals.qty.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">合計粗利</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">¥{totals.gross.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">平均粗利率</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{totals.grossRate}%</div>
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
              placeholder="商品コード・商品名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker value={from} onChange={setFrom} placeholder="開始日" />
          <DatePicker value={to} onChange={setTo} placeholder="終了日" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={shop} onChange={(e) => setShop(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">店舗: すべて</option>
            {shops.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={rank} onChange={(e) => setRank(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">ABCランク: すべて</option>
            <option value="A">A（売上80%以上）</option>
            <option value="B">B（売上15%付近）</option>
            <option value="C">C（売上5%以下）</option>
          </select>
          <SecondaryButton onClick={clearFilters}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {rows.length} 件（確定売上 {periodEntries.length} 計上）
          {skipped > 0 && <span className="text-amber-600 ml-2">※ 受注明細が見つからない {skipped} 計上は集計から除外</span>}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">カテゴリ</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">店舗</th>
              <th onClick={() => setSort("qty")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">販売数 {sortIcon("qty")}</th>
              <th onClick={() => setSort("amount")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">売上 {sortIcon("amount")}</th>
              <th onClick={() => setSort("cost")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">原価 {sortIcon("cost")}</th>
              <th onClick={() => setSort("gross")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">粗利 {sortIcon("gross")}</th>
              <th onClick={() => setSort("grossRate")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">粗利率 {sortIcon("grossRate")}</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ABC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.sku}-${r.shop}`} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{r.sku}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{r.name}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{r.category}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{r.shop}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{r.qty.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">¥{r.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">¥{r.cost.toLocaleString()}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums", r.gross < 0 ? "text-red-600" : "text-emerald-700")}>¥{r.gross.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{r.grossRate}%</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", rankBadge[r.rank])}>{r.rank}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">
                  {ledger.length === 0
                    ? "まだ確定売上がありません。出荷管理で出荷を確定すると、商品別の販売実績がここに集計されます。"
                    : "該当する商品がありません"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
