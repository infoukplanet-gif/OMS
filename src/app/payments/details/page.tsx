"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  PAYMENT_STATUSES,
  paymentStatusBadge,
} from "@/lib/state-machines/payment";
import { paymentStore } from "@/lib/stores/payment";
import { INITIAL_PAYMENTS, type SeededPayment } from "@/lib/seeds/payments";
import { downloadCsv } from "@/lib/export/csv";
import { Search, Download, X } from "lucide-react";

const fmt = (n: number) => `¥${n.toLocaleString()}`;

/** DatePicker の Date を seed の支払期日（"YYYY-MM-DD"）と同じ書式に揃える。 */
const fmtYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 状態フィルターの選択肢: SM の3状態 + 過剰入金フラグ */
const STATUS_OPTIONS = ["すべて", ...PAYMENT_STATUSES, "過剰入金"] as const;

/** 期日超過フィルター */
const OVERDUE_OPTIONS = ["すべて", "超過あり", "超過なし"] as const;

export default function PaymentDetailsPage() {
  // 入金ドメインの永続化オーナーは payments/page。ここは購読のみ＋防御的シード。
  useEffect(() => {
    if (paymentStore.getState().length === 0) {
      paymentStore.setItems(INITIAL_PAYMENTS);
    }
  }, []);
  const storeItems = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  );
  const payments = storeItems as ReadonlyArray<SeededPayment>;

  const [keyword, setKeyword] = useState("");
  const [dueFrom, setDueFrom] = useState<Date | undefined>(undefined);
  const [dueTo, setDueTo] = useState<Date | undefined>(undefined);
  const [methodFilter, setMethodFilter] = useState("すべて");
  const [statusFilter, setStatusFilter] = useState<string>("すべて");
  const [overdueFilter, setOverdueFilter] = useState<string>("すべて");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // 支払方法の選択肢は実データから導出（ハードコードの選択肢ズレを防ぐ）
  const methodOptions = useMemo(
    () => ["すべて", ...new Set(payments.map((p) => p.method))],
    [payments],
  );

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    const min = minAmount ? Number(minAmount) : 0;
    const max = maxAmount ? Number(maxAmount) : Infinity;
    const from = dueFrom ? fmtYmd(dueFrom) : "";
    const to = dueTo ? fmtYmd(dueTo) : "";
    return payments.filter((p) => {
      if (k && !p.order.toLowerCase().includes(k) && !p.customer.toLowerCase().includes(k)) return false;
      if (from && p.due < from) return false;
      if (to && p.due > to) return false;
      if (methodFilter !== "すべて" && p.method !== methodFilter) return false;
      if (statusFilter === "過剰入金") {
        if (!p.overpaid) return false;
      } else if (statusFilter !== "すべて" && p.status !== statusFilter) {
        return false;
      }
      if (overdueFilter === "超過あり" && p.daysOverdue <= 0) return false;
      if (overdueFilter === "超過なし" && p.daysOverdue > 0) return false;
      if (p.orderTotal < min || p.orderTotal > max) return false;
      return true;
    });
  }, [payments, keyword, dueFrom, dueTo, methodFilter, statusFilter, overdueFilter, minAmount, maxAmount]);

  const clearAll = () => {
    setKeyword("");
    setDueFrom(undefined);
    setDueTo(undefined);
    setMethodFilter("すべて");
    setStatusFilter("すべて");
    setOverdueFilter("すべて");
    setMinAmount("");
    setMaxAmount("");
  };

  const exportCsv = () => {
    downloadCsv(
      "入金詳細検索",
      ["伝票ID", "受注番号", "顧客", "受注額", "入金額", "支払方法", "支払期日", "超過日数", "状態", "過剰入金"],
      filtered.map((p) => [
        p.id,
        p.order,
        p.customer,
        p.orderTotal,
        p.paidAmount,
        p.method,
        p.due,
        p.daysOverdue,
        p.status,
        p.overpaid ? "あり" : "",
      ]),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金確認 詳細検索</h1>
            <HelpHint>入金状況を多軸で絞り込み検索します。支払期日・支払方法・金額・期日超過など複合条件で検索可能。入金管理ページと同じ共有データを表示しています。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ヒット: <span className="font-semibold">{filtered.length}件</span> ／ 合計入金額:{" "}
            <span className="font-semibold text-emerald-700">{fmt(filtered.reduce((s, p) => s + p.paidAmount, 0))}</span>
            {" "}／ 未回収残:{" "}
            <span className="font-semibold text-red-700">
              {fmt(filtered.reduce((s, p) => s + Math.max(0, p.orderTotal - p.paidAmount), 0))}
            </span>
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
        >
          <Download className="h-4 w-4" />結果をCSV
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">検索条件</h2>
          <button onClick={clearAll} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <X className="h-3.5 w-3.5" />クリア
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">キーワード</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="受注番号・顧客名"
                className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">支払期日 (開始)</label>
            <DatePicker placeholder="開始日" value={dueFrom} onChange={setDueFrom} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">支払期日 (終了)</label>
            <DatePicker placeholder="終了日" value={dueTo} onChange={setDueTo} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">支払方法</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {methodOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">入金状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">期日超過</label>
            <select value={overdueFilter} onChange={(e) => setOverdueFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {OVERDUE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">受注額（下限）</label>
            <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">受注額（上限）</label>
            <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">受注額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">支払方法</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">支払期日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">超過日数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-blue-600">{p.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{p.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(p.orderTotal)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{fmt(p.paidAmount)}</td>
                <td className="px-3 py-2.5 text-center text-xs">{p.method}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{p.due}</td>
                <td className={cn("px-3 py-2.5 text-center text-xs tabular-nums", p.daysOverdue > 0 ? "text-red-600 font-semibold" : "text-gray-400")}>
                  {p.daysOverdue > 0 ? `${p.daysOverdue}日` : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", paymentStatusBadge[p.status])}>
                    {p.status}
                  </span>
                  {p.overpaid && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700">
                      過剰
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400">
                  条件に一致する入金伝票がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
