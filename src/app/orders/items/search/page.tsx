"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, ArrowUpDown, X } from "lucide-react";
import { orderStore, type OrderRecord } from "@/lib/stores/orders";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { SKU_NAMES } from "@/lib/seeds/inventory";
import type { AllocationLine } from "@/lib/state-machines/inventory";

type Row = {
  orderId: string;
  productCode: string;
  productName: string;
  qty: number;
  price: number;
  orderedAt: Date;
  status: string;
};

/**
 * 共有 orderStore の受注を明細行（allocation lines）へ展開する。
 * 行単価は受注金額を数量按分した平均単価（v1 は明細単価を保持していないため）。
 */
function flattenOrderLines(orders: ReadonlyArray<OrderRecord>): Row[] {
  const rows: Row[] = [];
  for (const o of orders) {
    const lines = (o.allocation ?? []) as AllocationLine[];
    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    const amount = typeof o.amount === "number" ? o.amount : 0;
    const orderedAt = new Date(typeof o.date === "string" ? o.date : "");
    if (lines.length === 0 || totalQty === 0 || Number.isNaN(orderedAt.getTime())) continue;
    const unitPrice = Math.round(amount / totalQty);
    for (const line of lines) {
      rows.push({
        orderId: o.id,
        productCode: line.sku,
        productName: SKU_NAMES[line.sku] ?? line.sku,
        qty: line.qty,
        price: unitPrice,
        orderedAt,
        status: o.status,
      });
    }
  }
  return rows;
}

const statusBadge: Record<string, string> = {
  出荷済み: "bg-emerald-500/15 text-emerald-700",
  キャンセル: "bg-gray-400/15 text-gray-500",
};

const PAGE_SIZE = 10;

type SortKey = "orderedAt" | "qty" | "price";

export default function ItemsSearchPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);
  const [sortKey, setSortKey] = useState<SortKey>("orderedAt");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);

  // 共有 orderStore を購読（永続化オーナーは受注一覧側。ここは閲覧のみ）
  useEffect(() => {
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
  }, []);

  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS as ReadonlyArray<OrderRecord>,
  );

  const data = useMemo(() => flattenOrderLines(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.filter((r) => {
      const qOk = !q || [r.orderId, r.productCode, r.productName].some((v) => v.toLowerCase().includes(q));
      const fromOk = !from || r.orderedAt >= from;
      const toOk = !to || r.orderedAt <= to;
      return qOk && fromOk && toOk;
    });
    list = [...list].sort((a, b) => {
      const av = sortKey === "orderedAt" ? a.orderedAt.getTime() : (a[sortKey] as number);
      const bv = sortKey === "orderedAt" ? b.orderedAt.getTime() : (b[sortKey] as number);
      return sortDesc ? bv - av : av - bv;
    });
    return list;
  }, [data, query, from, to, sortKey, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDesc((v) => !v);
    else { setSortKey(k); setSortDesc(true); }
  }
  function clearFilters() {
    setQuery(""); setFrom(undefined); setTo(undefined); setPage(1);
    toast.show("条件をクリアしました", "info");
  }

  const fmtDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

  const total = filtered.reduce((s, r) => s + r.qty * r.price, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">受注明細検索</h1>
        <p className="text-sm text-gray-500 mt-1">
          受注一覧と同じ共有データを明細行に展開して検索します。受注作成・状態遷移が即時反映されます。
        </p>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">キーワード</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="受注番号・商品コード・商品名"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">受注日（開始）</label>
            <DatePicker value={from} onChange={(d) => { setFrom(d); setPage(1); }} placeholder="開始日" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">受注日（終了）</label>
            <DatePicker value={to} onChange={(d) => { setTo(d); setPage(1); }} placeholder="終了日" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <SecondaryButton onClick={clearFilters}>
            <span className="inline-flex items-center gap-1"><X className="h-3.5 w-3.5" />条件クリア</span>
          </SecondaryButton>
          <span className="text-xs text-gray-500 ml-auto tabular-nums">
            {filtered.length} 件 / 合計 ¥{total.toLocaleString()}
          </span>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {pageRows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">該当する明細がありません</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品コード</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 w-20">
                    <button type="button" onClick={() => toggleSort("qty")} className="inline-flex items-center gap-1 hover:text-gray-700">
                      数量 <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 w-28">
                    <button type="button" onClick={() => toggleSort("price")} className="inline-flex items-center gap-1 hover:text-gray-700">
                      単価 <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 w-28">小計</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 w-28">
                    <button type="button" onClick={() => toggleSort("orderedAt")} className="inline-flex items-center gap-1 hover:text-gray-700">
                      受注日 <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 w-24">状態</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={`${r.orderId}-${r.productCode}-${i}`} className="border-t border-white/30 hover:bg-white/40">
                    <td className="px-3 py-2.5 font-medium text-blue-600">{r.orderId}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.productCode}</td>
                    <td className="px-3 py-2.5 text-gray-800">{r.productName}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.qty}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">¥{r.price.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">¥{(r.qty * r.price).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{fmtDate(r.orderedAt)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        statusBadge[r.status] ?? "bg-blue-500/15 text-blue-700",
                      )}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-3 py-3 border-t border-white/40 bg-white/30">
              <span className="text-xs text-gray-500 tabular-nums">
                {(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} 件
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="px-2 text-xs text-gray-600 tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
