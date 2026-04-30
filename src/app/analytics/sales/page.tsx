"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Download, TrendingDown, TrendingUp } from "lucide-react";

type DailyRow = {
  date: string;
  shop: string;
  channel: string;
  orders: number;
  amount: number;
  cost: number;
  gross: number;
  cancelled: number;
  returnAmount: number;
  newCustomers: number;
  repeatRate: number;
};

const data: DailyRow[] = [
  { date: "2026/04/30", shop: "本店", channel: "オンライン", orders: 142, amount: 2_840_000, cost: 1_136_000, gross: 1_704_000, cancelled: 3, returnAmount: 28_000, newCustomers: 42, repeatRate: 35 },
  { date: "2026/04/30", shop: "楽天店", channel: "オンライン", orders: 88, amount: 1_760_000, cost: 880_000, gross: 880_000, cancelled: 1, returnAmount: 12_000, newCustomers: 28, repeatRate: 30 },
  { date: "2026/04/30", shop: "Yahoo!店", channel: "オンライン", orders: 56, amount: 1_120_000, cost: 560_000, gross: 560_000, cancelled: 0, returnAmount: 0, newCustomers: 18, repeatRate: 28 },
  { date: "2026/04/29", shop: "本店", channel: "オンライン", orders: 138, amount: 2_760_000, cost: 1_104_000, gross: 1_656_000, cancelled: 2, returnAmount: 14_000, newCustomers: 38, repeatRate: 36 },
  { date: "2026/04/29", shop: "楽天店", channel: "オンライン", orders: 92, amount: 1_840_000, cost: 920_000, gross: 920_000, cancelled: 1, returnAmount: 0, newCustomers: 30, repeatRate: 32 },
  { date: "2026/04/29", shop: "Amazon店", channel: "オンライン", orders: 64, amount: 1_280_000, cost: 768_000, gross: 512_000, cancelled: 2, returnAmount: 18_000, newCustomers: 22, repeatRate: 22 },
  { date: "2026/04/28", shop: "本店", channel: "オンライン", orders: 122, amount: 2_440_000, cost: 976_000, gross: 1_464_000, cancelled: 4, returnAmount: 32_000, newCustomers: 35, repeatRate: 38 },
  { date: "2026/04/28", shop: "本店", channel: "電話", orders: 12, amount: 360_000, cost: 144_000, gross: 216_000, cancelled: 0, returnAmount: 0, newCustomers: 0, repeatRate: 100 },
  { date: "2026/04/28", shop: "楽天店", channel: "オンライン", orders: 80, amount: 1_600_000, cost: 800_000, gross: 800_000, cancelled: 0, returnAmount: 0, newCustomers: 24, repeatRate: 31 },
  { date: "2026/04/27", shop: "本店", channel: "オンライン", orders: 130, amount: 2_600_000, cost: 1_040_000, gross: 1_560_000, cancelled: 1, returnAmount: 0, newCustomers: 40, repeatRate: 33 },
  { date: "2026/04/27", shop: "Yahoo!店", channel: "オンライン", orders: 48, amount: 960_000, cost: 480_000, gross: 480_000, cancelled: 0, returnAmount: 8_000, newCustomers: 16, repeatRate: 30 },
  { date: "2026/04/26", shop: "本店", channel: "オンライン", orders: 96, amount: 1_920_000, cost: 768_000, gross: 1_152_000, cancelled: 2, returnAmount: 12_000, newCustomers: 28, repeatRate: 32 },
];

const shops = Array.from(new Set(data.map((d) => d.shop)));
const channels = Array.from(new Set(data.map((d) => d.channel)));

type SortKey = "orders" | "amount" | "gross";

export default function AnalyticsSalesPage() {
  const toast = useToast();
  const [shop, setShop] = useState("all");
  const [channel, setChannel] = useState("all");
  const [groupBy, setGroupBy] = useState<"none" | "shop" | "date">("none");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(
    () =>
      data
        .filter((d) => (shop === "all" || d.shop === shop) && (channel === "all" || d.channel === channel))
        .sort((a, b) => (sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey])),
    [shop, channel, sortKey, sortDir]
  );

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, { key: string; orders: number; amount: number; gross: number; cancelled: number; returnAmount: number }>();
    for (const r of filtered) {
      const k = groupBy === "shop" ? r.shop : r.date;
      const cur = map.get(k) || { key: k, orders: 0, amount: 0, gross: 0, cancelled: 0, returnAmount: 0 };
      cur.orders += r.orders;
      cur.amount += r.amount;
      cur.gross += r.gross;
      cur.cancelled += r.cancelled;
      cur.returnAmount += r.returnAmount;
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered, groupBy]);

  const totals = useMemo(
    () => ({
      orders: filtered.reduce((s, d) => s + d.orders, 0),
      amount: filtered.reduce((s, d) => s + d.amount, 0),
      gross: filtered.reduce((s, d) => s + d.gross, 0),
      cancelled: filtered.reduce((s, d) => s + d.cancelled, 0),
      returnAmount: filtered.reduce((s, d) => s + d.returnAmount, 0),
      newCustomers: filtered.reduce((s, d) => s + d.newCustomers, 0),
      avgOrderValue: filtered.length > 0 ? Math.round(filtered.reduce((s, d) => s + d.amount, 0) / filtered.reduce((s, d) => s + d.orders, 0)) : 0,
      avgRepeatRate: filtered.length > 0 ? Math.round(filtered.reduce((s, d) => s + d.repeatRate, 0) / filtered.length) : 0,
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
            <h1 className="text-2xl font-bold text-gray-800">売上分析</h1>
            <HelpHint>店舗・チャネル・日次粒度で売上を集計。粗利・キャンセル・返品・新規/リピート構成を一覧で把握できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">日々の販売動向と粗利推移、キャンセル・返品の発生量を統合可視化します。</p>
        </div>
        <SecondaryButton onClick={() => toast.show("売上分析をCSVで書き出しました", "success")}>
          <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" />CSV書き出し</span>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500 inline-flex items-center gap-1">合計売上 <TrendingUp className="h-3 w-3 text-emerald-500" /></div>
          <div className="text-2xl font-bold text-blue-600 mt-1">¥{totals.amount.toLocaleString()}</div>
          <div className="text-xs text-emerald-600 mt-0.5">前期比 +8.2%</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">合計粗利</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">¥{totals.gross.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">粗利率 {totals.amount > 0 ? Math.round((totals.gross / totals.amount) * 100) : 0}%</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">受注件数 / 平均単価</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{totals.orders.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">¥{totals.avgOrderValue.toLocaleString()} / 件</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500 inline-flex items-center gap-1">キャンセル/返品 <TrendingDown className="h-3 w-3 text-red-500" /></div>
          <div className="text-2xl font-bold text-red-600 mt-1">{totals.cancelled}</div>
          <div className="text-xs text-gray-500 mt-0.5">返品額 ¥{totals.returnAmount.toLocaleString()}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker placeholder="開始日" />
          <DatePicker placeholder="終了日" />
          <select value={shop} onChange={(e) => setShop(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">店舗: すべて</option>
            {shops.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">チャネル: すべて</option>
            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="none">集計: 明細表示</option>
            <option value="shop">集計: 店舗別</option>
            <option value="date">集計: 日次</option>
          </select>
          <SecondaryButton onClick={() => { setShop("all"); setChannel("all"); setGroupBy("none"); }}>
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {grouped ? `${grouped.length} グループ` : `${filtered.length} 件 / 全 ${data.length} 件`}
        </div>
        {grouped ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">{groupBy === "shop" ? "店舗" : "日付"}</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">受注件数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">売上金額</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">粗利</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">粗利率</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">キャンセル</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">返品額</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => (
                <tr key={g.key} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-medium text-gray-800">{g.key}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{g.orders.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">¥{g.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">¥{g.gross.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{g.amount > 0 ? Math.round((g.gross / g.amount) * 100) : 0}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-red-600">{g.cancelled}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-red-600">¥{g.returnAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">日付</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">チャネル</th>
                <th onClick={() => setSort("orders")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">受注 {sortIcon("orders")}</th>
                <th onClick={() => setSort("amount")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">売上 {sortIcon("amount")}</th>
                <th onClick={() => setSort("gross")} className="px-3 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800">粗利 {sortIcon("gross")}</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">粗利率</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">キャンセル</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">返品額</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">新規/リピート</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={`${d.date}-${d.shop}-${d.channel}-${i}`} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{d.date}</td>
                  <td className="px-3 py-2.5 text-gray-800">{d.shop}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">{d.channel}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.orders}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">¥{d.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">¥{d.gross.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{Math.round((d.gross / d.amount) * 100)}%</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums text-xs", d.cancelled > 0 ? "text-red-600" : "text-gray-400")}>{d.cancelled}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums text-xs", d.returnAmount > 0 ? "text-red-600" : "text-gray-400")}>¥{d.returnAmount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-gray-600">{d.newCustomers} / {d.repeatRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
