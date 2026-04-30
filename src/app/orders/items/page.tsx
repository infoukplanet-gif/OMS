"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown, DropdownItem } from "@/components/ui/interactive";

type Item = {
  order: string;
  code: string;
  name: string;
  price: string;
  qty: number;
  subtotal: string;
  status: "引当済" | "未引当" | "出荷済";
  date: string;
};

const allItems: Item[] = [
  { order: "ORD-2024-00851", code: "WEP-001", name: "ワイヤレスイヤホン Pro", price: "¥12,800", qty: 2, subtotal: "¥25,600", status: "引当済", date: "2024-04-11" },
  { order: "ORD-2024-00851", code: "UCB-002", name: "USB-Cケーブル 2m", price: "¥1,280", qty: 3, subtotal: "¥3,840", status: "引当済", date: "2024-04-11" },
  { order: "ORD-2024-00850", code: "MBT-004", name: "モバイルバッテリー 20000mAh", price: "¥4,980", qty: 1, subtotal: "¥4,980", status: "引当済", date: "2024-04-11" },
  { order: "ORD-2024-00849", code: "SWB-003", name: "スマートウォッチバンド", price: "¥3,980", qty: 5, subtotal: "¥19,900", status: "未引当", date: "2024-04-10" },
  { order: "ORD-2024-00849", code: "CHG-007", name: "急速充電器 65W", price: "¥3,480", qty: 2, subtotal: "¥6,960", status: "引当済", date: "2024-04-10" },
  { order: "ORD-2024-00848", code: "PFS-005", name: "保護フィルム セット", price: "¥1,580", qty: 2, subtotal: "¥3,160", status: "出荷済", date: "2024-04-09" },
  { order: "ORD-2024-00847", code: "HDP-009", name: "ノイキャンヘッドホン", price: "¥24,800", qty: 1, subtotal: "¥24,800", status: "出荷済", date: "2024-04-08" },
  { order: "ORD-2024-00846", code: "STD-011", name: "ノートPCスタンド", price: "¥2,980", qty: 1, subtotal: "¥2,980", status: "未引当", date: "2024-04-07" },
];

const STATUSES = ["すべて", "引当済", "未引当", "出荷済"] as const;
type StatusFilter = typeof STATUSES[number];

const sb: Record<string, string> = {
  引当済: "bg-emerald-500/15 text-emerald-700",
  未引当: "bg-yellow-500/15 text-yellow-700",
  出荷済: "bg-blue-500/15 text-blue-700",
};

const PAGE_SIZE = 5;

export default function OrderItemsPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("すべて");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return allItems.filter((i) => {
      if (kw && !i.code.toLowerCase().includes(kw) && !i.name.toLowerCase().includes(kw) && !i.order.toLowerCase().includes(kw)) {
        return false;
      }
      if (status !== "すべて" && i.status !== status) return false;
      const d = new Date(i.date);
      if (from && d < new Date(from.toDateString())) return false;
      if (to && d > new Date(to.toDateString())) return false;
      return true;
    });
  }, [keyword, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFilters() {
    setKeyword("");
    setStatus("すべて");
    setFrom(undefined);
    setTo(undefined);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">受注明細一覧</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="伝票番号・商品コード・商品名で検索..."
            className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <Dropdown
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
            >
              ステータス: <span className="font-medium">{status}</span>
            </button>
          )}
        >
          {(close) => (
            <>
              {STATUSES.map((s) => (
                <DropdownItem
                  key={s}
                  selected={s === status}
                  onClick={() => { setStatus(s); setPage(1); close(); }}
                >
                  {s}
                </DropdownItem>
              ))}
            </>
          )}
        </Dropdown>

        <DatePicker
          compact
          placeholder="開始日"
          value={from}
          onChange={(d) => { setFrom(d); setPage(1); }}
        />
        <span className="text-gray-400 text-sm">〜</span>
        <DatePicker
          compact
          placeholder="終了日"
          value={to}
          onChange={(d) => { setTo(d); setPage(1); }}
        />

        <button
          type="button"
          onClick={resetFilters}
          className="px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
        >
          クリア
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">伝票番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">単価</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">小計</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-400">
                  該当する明細がありません
                </td>
              </tr>
            ) : (
              pageItems.map((i, idx) => (
                <tr key={`${i.order}-${i.code}-${idx}`} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-blue-600">{i.order}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.code}</td>
                  <td className="px-3 py-2.5 text-gray-800">{i.name}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{i.price}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700">{i.qty}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-800">{i.subtotal}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[i.status])}>{i.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-between items-center px-4 py-3 border-t border-white/40 bg-white/30">
          <span className="text-sm text-gray-500">
            {filtered.length === 0
              ? "0件"
              : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} / ${filtered.length}件`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
