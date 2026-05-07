"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  type OrderStatus,
  ORDER_STATUSES,
  orderStatusBadge,
} from "@/lib/state-machines/order";
import {
  Search,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

type Order = {
  id: string;
  shop: string;
  customer: string;
  items: number;
  amount: number;
  payment: string;
  status: OrderStatus;
  date: string;
};

const statusBadge = orderStatusBadge;

const paymentBadge: Record<string, string> = {
  クレジットカード: "bg-purple-500/15 text-purple-700",
  銀行振込: "bg-blue-500/15 text-blue-700",
  代金引換: "bg-orange-500/15 text-orange-700",
  請求書払い: "bg-teal-500/15 text-teal-700",
};

const shopColors: Record<string, string> = {
  楽天市場: "bg-red-500",
  Amazon: "bg-orange-400",
  Shopify: "bg-green-500",
  "Yahoo!": "bg-purple-500",
};

const initial: Order[] = [
  { id: "ORD-2026-08851", shop: "楽天市場", customer: "山田 太郎", items: 3, amount: 32_400, payment: "クレジットカード", status: "新規受付", date: "2026/04/30 10:42" },
  { id: "ORD-2026-08850", shop: "Amazon", customer: "佐藤 花子", items: 1, amount: 8_900, payment: "クレジットカード", status: "印刷待ち", date: "2026/04/30 10:35" },
  { id: "ORD-2026-08849", shop: "Shopify", customer: "田中 一郎", items: 5, amount: 154_000, payment: "請求書払い", status: "確認待ち", date: "2026/04/30 10:22" },
  { id: "ORD-2026-08848", shop: "Yahoo!", customer: "鈴木 美咲", items: 2, amount: 5_600, payment: "銀行振込", status: "出荷済み", date: "2026/04/30 09:58" },
  { id: "ORD-2026-08847", shop: "楽天市場", customer: "高橋 健", items: 1, amount: 22_800, payment: "代金引換", status: "印刷済み", date: "2026/04/30 09:41" },
  { id: "ORD-2026-08846", shop: "Amazon", customer: "渡辺 京子", items: 4, amount: 45_200, payment: "クレジットカード", status: "新規受付", date: "2026/04/30 09:30" },
  { id: "ORD-2026-08845", shop: "Shopify", customer: "伊藤 大輔", items: 2, amount: 18_600, payment: "クレジットカード", status: "引当待ち", date: "2026/04/30 09:15" },
  { id: "ORD-2026-08844", shop: "Yahoo!", customer: "中村 あかり", items: 1, amount: 3_200, payment: "銀行振込", status: "出荷済み", date: "2026/04/29 18:55" },
  { id: "ORD-2026-08843", shop: "楽天市場", customer: "小林 修", items: 3, amount: 67_500, payment: "クレジットカード", status: "入金待ち", date: "2026/04/29 16:40" },
  { id: "ORD-2026-08842", shop: "Amazon", customer: "加藤 裕子", items: 2, amount: 12_400, payment: "代金引換", status: "キャンセル", date: "2026/04/29 14:22" },
  { id: "ORD-2026-08841", shop: "楽天市場", customer: "吉田 あゆみ", items: 4, amount: 56_800, payment: "クレジットカード", status: "発売日時待ち", date: "2026/04/29 11:10" },
  { id: "ORD-2026-08840", shop: "Yahoo!", customer: "松本 愛", items: 2, amount: 15_800, payment: "クレジットカード", status: "印刷待ち", date: "2026/04/28 15:00" },
];

const tabs: { label: string; value: "all" | OrderStatus }[] = [
  { label: "すべて", value: "all" },
  ...ORDER_STATUSES.map((s) => ({ label: s, value: s as OrderStatus })),
];

const shops = ["楽天市場", "Amazon", "Shopify", "Yahoo!"];
const payments = ["クレジットカード", "銀行振込", "代金引換", "請求書払い"];

const fmtDate = (d: Date | undefined) =>
  d ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}` : "";

export default function OrdersPage() {
  const [items] = useState(initial);
  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((o) => {
      if (activeTab !== "all" && o.status !== activeTab) return false;
      if (k && !`${o.id} ${o.customer}`.toLowerCase().includes(k)) return false;
      if (shopFilter !== "all" && o.shop !== shopFilter) return false;
      if (paymentFilter !== "all" && o.payment !== paymentFilter) return false;
      const orderDate = o.date.slice(0, 10);
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
      return true;
    });
  }, [items, activeTab, keyword, shopFilter, paymentFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const o of items) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [items]);

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected((p) => (p.length === filtered.length ? [] : filtered.map((o) => o.id)));

  const hasFilter = keyword || shopFilter !== "all" || paymentFilter !== "all" || dateFrom || dateTo;
  const toast = useToast();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">受注一覧</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/orders/import"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}
          >
            <Upload className="h-4 w-4" />
            CSVインポート
          </Link>
          <Link
            href="/orders/new"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}
          >
            <Plus className="h-4 w-4" />
            受注登録
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-max sm:w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setSelected([]); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              {tab.label}
              <span className={cn("px-1.5 py-0.5 rounded-md text-xs", activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500")}>
                {(tab.value === "all" ? counts.all : counts[tab.value] || 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(2,minmax(140px,180px))_minmax(280px,auto)_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="受注番号・顧客名で検索"
            className={cn("w-full h-9 pl-10 pr-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20")}
          />
        </div>
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">店舗: すべて</option>
          {shops.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">支払方法: すべて</option>
          {payments.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-1.5 min-w-0">
          <DatePicker compact placeholder="開始日" onChange={(d) => setDateFrom(fmtDate(d))} />
          <span className="text-xs text-gray-400 shrink-0">〜</span>
          <DatePicker compact placeholder="終了日" onChange={(d) => setDateTo(fmtDate(d))} />
        </div>
        {hasFilter && (
          <button
            onClick={() => { setKeyword(""); setShopFilter("all"); setPaymentFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70 whitespace-nowrap"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">点数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">支払方法</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注日時</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className={cn("border-t border-white/30 transition-colors", selected.includes(order.id) ? "bg-blue-500/5" : "hover:bg-white/40")}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link href={`/orders/${order.id}/edit`} className="font-medium text-blue-600 hover:underline">{order.id}</Link>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", shopColors[order.shop])} />
                      {order.shop}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{order.customer}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{order.items}</td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums">¥{order.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", paymentBadge[order.payment])}>{order.payment}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", statusBadge[order.status])}>{order.status}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{order.date}</td>
                  <td className="px-3 py-3">
                    <Link href={`/orders/${order.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-gray-400">該当する受注がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-white/40 bg-white/30">
          <div className="min-h-[28px]">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button onClick={() => toast.show(`${selected.length} 件のステータスを変更します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">ステータス変更</button>
                <button onClick={() => toast.show(`${selected.length} 件の出荷指示を作成します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">出荷指示</button>
                <button onClick={() => toast.show(`${selected.length} 件をエクスポートしました`, "success")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 transition-colors">エクスポート</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} 件 / 全 {items.length} 件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400 hover:bg-white/70 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
