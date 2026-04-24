"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { SecondaryButton, useToast } from "@/components/ui/interactive";
import { Search, ArrowUpDown, X } from "lucide-react";

type Row = {
  orderId: string;
  productCode: string;
  productName: string;
  qty: number;
  price: number;
  orderedAt: Date;
};

function makeRows(): Row[] {
  const names = [
    ["SKU-A001", "オーガニック緑茶 500ml"],
    ["SKU-A002", "エスプレッソビーンズ 200g"],
    ["SKU-B010", "ワイヤレスイヤホン Lite"],
    ["SKU-B012", "モバイルバッテリー 10000mAh"],
    ["SKU-C003", "撥水ナイロンリュック"],
    ["SKU-C005", "レザーキーホルダー"],
    ["SKU-D020", "アロマキャンドル ローズ"],
    ["SKU-E042", "スキンケアセット（敏感肌用）"],
    ["SKU-F101", "ステンレスタンブラー 350ml"],
    ["SKU-F102", "ギフト用ラッピング"],
  ];
  const out: Row[] = [];
  for (let i = 0; i < 56; i++) {
    const n = names[i % names.length];
    const d = new Date();
    d.setDate(d.getDate() - (i % 30));
    out.push({
      orderId: `ORD-2026-${String(1000 + i).padStart(5, "0")}`,
      productCode: n[0],
      productName: n[1],
      qty: 1 + (i % 4),
      price: 800 + (i * 137) % 9000,
      orderedAt: d,
    });
  }
  return out;
}

const data = makeRows();
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
  }, [query, from, to, sortKey, sortDesc]);

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

  const total = filtered.reduce((s, r) => s + r.qty * r.price, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">受注明細検索</h1>

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
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr key={r.orderId + i} className="border-t border-white/30 hover:bg-white/40">
                    <td className="px-3 py-2.5 font-medium text-blue-600">{r.orderId}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.productCode}</td>
                    <td className="px-3 py-2.5 text-gray-800">{r.productName}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.qty}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">¥{r.price.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">¥{(r.qty * r.price).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">
                      {r.orderedAt.toISOString().slice(0, 10)}
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
