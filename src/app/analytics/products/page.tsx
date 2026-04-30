"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";

type Product = {
  code: string;
  name: string;
  category: string;
  shop: string;
  qty: number;
  amount: number;
  cost: number;
  gross: number;
  grossRate: number;
  returns: number;
  rank: "A" | "B" | "C";
  trend: "up" | "down" | "flat";
  trendRate: number;
};

const data: Product[] = [
  { code: "P-001", name: "コットンTシャツ ホワイト", category: "アパレル", shop: "本店", qty: 1240, amount: 4_960_000, cost: 1_984_000, gross: 2_976_000, grossRate: 60, returns: 8, rank: "A", trend: "up", trendRate: 12 },
  { code: "P-002", name: "デニムジャケット", category: "アパレル", shop: "楽天店", qty: 580, amount: 8_120_000, cost: 4_060_000, gross: 4_060_000, grossRate: 50, returns: 22, rank: "A", trend: "up", trendRate: 8 },
  { code: "P-003", name: "ステンレスタンブラー", category: "雑貨", shop: "本店", qty: 980, amount: 1_960_000, cost: 588_000, gross: 1_372_000, grossRate: 70, returns: 2, rank: "A", trend: "flat", trendRate: 0 },
  { code: "P-004", name: "オーガニックコーヒー豆", category: "食品", shop: "本店", qty: 720, amount: 1_440_000, cost: 720_000, gross: 720_000, grossRate: 50, returns: 0, rank: "B", trend: "up", trendRate: 18 },
  { code: "P-005", name: "ナチュラルコスメセット", category: "コスメ", shop: "Yahoo!店", qty: 320, amount: 1_920_000, cost: 768_000, gross: 1_152_000, grossRate: 60, returns: 14, rank: "B", trend: "down", trendRate: -5 },
  { code: "P-006", name: "ワイヤレスイヤホン", category: "家電", shop: "Amazon店", qty: 150, amount: 2_250_000, cost: 1_350_000, gross: 900_000, grossRate: 40, returns: 6, rank: "B", trend: "up", trendRate: 22 },
  { code: "P-007", name: "革製キーケース", category: "雑貨", shop: "本店", qty: 88, amount: 264_000, cost: 132_000, gross: 132_000, grossRate: 50, returns: 1, rank: "C", trend: "down", trendRate: -8 },
  { code: "P-008", name: "ストーンウェアマグ", category: "雑貨", shop: "楽天店", qty: 65, amount: 130_000, cost: 65_000, gross: 65_000, grossRate: 50, returns: 0, rank: "C", trend: "flat", trendRate: 1 },
  { code: "P-009", name: "リネンエプロン", category: "アパレル", shop: "本店", qty: 32, amount: 96_000, cost: 38_400, gross: 57_600, grossRate: 60, returns: 0, rank: "C", trend: "down", trendRate: -12 },
];

const categories = Array.from(new Set(data.map((d) => d.category)));
const shops = Array.from(new Set(data.map((d) => d.shop)));

type SortKey = "amount" | "qty" | "gross" | "grossRate" | "returns" | "trendRate";

const rankBadge: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-700",
  B: "bg-blue-500/15 text-blue-700",
  C: "bg-gray-500/15 text-gray-600",
};

export default function AnalyticsProductsPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [shop, setShop] = useState("all");
  const [rank, setRank] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return data
      .filter((d) => {
        if (k && !`${d.code} ${d.name}`.toLowerCase().includes(k)) return false;
        if (category !== "all" && d.category !== category) return false;
        if (shop !== "all" && d.shop !== shop) return false;
        if (rank !== "all" && d.rank !== rank) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [keyword, category, shop, rank, sortKey, sortDir]);

  const totals = useMemo(
    () => ({
      amount: filtered.reduce((s, d) => s + d.amount, 0),
      qty: filtered.reduce((s, d) => s + d.qty, 0),
      gross: filtered.reduce((s, d) => s + d.gross, 0),
      grossRate: filtered.length > 0 ? Math.round((filtered.reduce((s, d) => s + d.grossRate, 0) / filtered.length) * 10) / 10 : 0,
    }),
    [filtered]
  );

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === "desc" ? <ArrowDown className="h-3 w-3 inline" /> : <ArrowUp className="h-3 w-3 inline" />) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">商品別分析</h1>
            <HelpHint>商品ごとの売上・粗利・返品・ABC ランクを横断分析。期間と店舗・カテゴリで絞り込み、CSVに書き出せます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">売れ筋・死筋の特定、粗利改善、返品率の高い商品の特定にご利用ください。</p>
        </div>
        <SecondaryButton onClick={() => toast.show("商品別分析をCSVで書き出しました", "success")}>
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
          <DatePicker placeholder="開始日" />
          <DatePicker placeholder="終了日" />
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
          <SecondaryButton onClick={() => { setKeyword(""); setCategory("all"); setShop("all"); setRank("all"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {data.length} 件
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
              <th onClick={() => setSort("gross")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">粗利 {sortIcon("gross")}</th>
              <th onClick={() => setSort("grossRate")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">粗利率 {sortIcon("grossRate")}</th>
              <th onClick={() => setSort("returns")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">返品 {sortIcon("returns")}</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ABC</th>
              <th onClick={() => setSort("trendRate")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">前期比 {sortIcon("trendRate")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.code} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{d.code}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{d.name}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{d.category}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{d.shop}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">¥{d.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">¥{d.gross.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.grossRate}%</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500 text-xs">{d.returns}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", rankBadge[d.rank])}>{d.rank}</span>
                </td>
                <td className={cn(
                  "px-3 py-2.5 text-right tabular-nums text-xs font-medium",
                  d.trendRate > 0 ? "text-emerald-600" : d.trendRate < 0 ? "text-red-600" : "text-gray-500"
                )}>
                  {d.trendRate > 0 ? "+" : ""}{d.trendRate}%
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-sm text-gray-400">該当する商品がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
