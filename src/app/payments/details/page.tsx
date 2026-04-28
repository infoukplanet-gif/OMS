"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Download, X } from "lucide-react";

type Detail = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  paid: number;
  method: string;
  paidAt: string;
  bank: string;
  status: "入金済" | "未入金" | "一部入金" | "過剰入金";
};

const DATA: Detail[] = [
  { id: "P-001", order: "ORD-2026-00851", customer: "山田太郎", amount: 32400, paid: 32400, method: "クレカ", paidAt: "2026-04-25", bank: "Stripe", status: "入金済" },
  { id: "P-002", order: "ORD-2026-00849", customer: "田中一郎", amount: 154000, paid: 0, method: "銀行振込", paidAt: "—", bank: "—", status: "未入金" },
  { id: "P-003", order: "ORD-2026-00838", customer: "井上智", amount: 28500, paid: 25000, method: "銀行振込", paidAt: "2026-04-22", bank: "三井住友銀行", status: "一部入金" },
  { id: "P-004", order: "ORD-2026-00830", customer: "山田太郎", amount: 18200, paid: 18200, method: "銀行振込", paidAt: "2026-04-25", bank: "三井住友銀行", status: "入金済" },
  { id: "P-005", order: "ORD-2026-00820", customer: "佐藤花子", amount: 12400, paid: 12800, method: "クレカ", paidAt: "2026-04-15", bank: "Stripe", status: "過剰入金" },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PaymentDetailsPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("すべて");
  const [statusFilter, setStatusFilter] = useState("すべて");
  const [bankFilter, setBankFilter] = useState("すべて");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    const min = minAmount ? Number(minAmount) : 0;
    const max = maxAmount ? Number(maxAmount) : Infinity;
    return DATA.filter((d) => {
      if (k && !d.order.toLowerCase().includes(k) && !d.customer.toLowerCase().includes(k)) return false;
      if (methodFilter !== "すべて" && d.method !== methodFilter) return false;
      if (statusFilter !== "すべて" && d.status !== statusFilter) return false;
      if (bankFilter !== "すべて" && !d.bank.includes(bankFilter)) return false;
      if (d.amount < min || d.amount > max) return false;
      return true;
    });
  }, [keyword, methodFilter, statusFilter, bankFilter, minAmount, maxAmount]);

  const clearAll = () => {
    setKeyword("");
    setMethodFilter("すべて");
    setStatusFilter("すべて");
    setBankFilter("すべて");
    setMinAmount("");
    setMaxAmount("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金確認 詳細検索</h1>
            <HelpHint>入金状況を多軸で絞り込み検索します。期間・支払方法・金額・入金元など複合条件で検索可能。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ヒット: <span className="font-semibold">{filtered.length}件</span> ／ 合計入金額:{" "}
            <span className="font-semibold text-emerald-700">{fmt(filtered.reduce((s, d) => s + d.paid, 0))}</span>
          </p>
        </div>
        <button
          onClick={() => toast.show("検索結果をCSVエクスポート")}
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
            <label className="text-sm font-medium text-gray-700">入金日 (開始)</label>
            <DatePicker placeholder="開始日" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">入金日 (終了)</label>
            <DatePicker placeholder="終了日" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">支払方法</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "銀行振込", "クレカ", "代引", "コンビニ", "ペイディ"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">入金状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "入金済", "未入金", "一部入金", "過剰入金"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">入金元</label>
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["すべて", "三井住友銀行", "みずほ銀行", "三菱UFJ", "Stripe", "Amazon Pay"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">金額（下限）</label>
            <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">金額（上限）</label>
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金元</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-blue-600">{d.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{d.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmt(d.amount)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{fmt(d.paid)}</td>
                <td className="px-3 py-2.5 text-center text-xs">{d.method}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500">{d.paidAt}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{d.bank}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      d.status === "入金済" && "bg-emerald-500/15 text-emerald-700",
                      d.status === "未入金" && "bg-red-500/15 text-red-700",
                      d.status === "一部入金" && "bg-yellow-500/15 text-yellow-700",
                      d.status === "過剰入金" && "bg-purple-500/15 text-purple-700"
                    )}
                  >
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
