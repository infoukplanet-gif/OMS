"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Plus, Banknote, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

type Invoice = {
  id: string;
  poNumber: string;
  supplier: string;
  amount: number;
  paid: number;
  invoiceDate: string;
  dueDate: string;
  daysToDue: number;
  status: "未支払" | "支払済" | "一部支払";
};

const INVOICES: Invoice[] = [
  { id: "INV-2026-0084", poNumber: "PO-2026-0044", supplier: "グローバルパーツ合同会社", amount: 128000, paid: 0, invoiceDate: "2026-04-23", dueDate: "2026-05-31", daysToDue: 33, status: "未支払" },
  { id: "INV-2026-0083", poNumber: "PO-2026-0043", supplier: "株式会社ケーブルワークス", amount: 56000, paid: 56000, invoiceDate: "2026-04-21", dueDate: "2026-05-31", daysToDue: 33, status: "支払済" },
  { id: "INV-2026-0082", poNumber: "PO-2026-0042", supplier: "株式会社ABC電子", amount: 89000, paid: 89000, invoiceDate: "2026-04-19", dueDate: "2026-05-31", daysToDue: 33, status: "支払済" },
  { id: "INV-2026-0081", poNumber: "PO-2026-0038", supplier: "株式会社ABC電子", amount: 245000, paid: 100000, invoiceDate: "2026-03-25", dueDate: "2026-04-30", daysToDue: 2, status: "一部支払" },
  { id: "INV-2026-0080", poNumber: "PO-2026-0035", supplier: "アジアサプライ株式会社", amount: 84000, paid: 0, invoiceDate: "2026-03-15", dueDate: "2026-04-15", daysToDue: -10, status: "未支払" },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PurchasingInvoicesPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未完了のみ");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return INVOICES.filter((i) => {
      if (k && !i.id.toLowerCase().includes(k) && !i.supplier.toLowerCase().includes(k) && !i.poNumber.toLowerCase().includes(k)) return false;
      if (statusFilter === "未完了のみ" && i.status === "支払済") return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && i.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, statusFilter]);

  const stats = {
    unpaid: INVOICES.filter((i) => i.status === "未支払").length,
    overdue: INVOICES.filter((i) => i.daysToDue < 0 && i.status !== "支払済").length,
    payable: INVOICES.filter((i) => i.status !== "支払済").reduce((s, i) => s + (i.amount - i.paid), 0),
    dueSoon: INVOICES.filter((i) => i.daysToDue >= 0 && i.daysToDue <= 7 && i.status !== "支払済").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">仕入伝票管理</h1>
            <HelpHint>仕入先からの請求書を管理し、支払予定・支払済を一覧で追跡します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未支払: <span className="font-semibold text-amber-700">{stats.unpaid}件</span> ／ 期日超過:{" "}
            <span className="font-semibold text-red-700">{stats.overdue}件</span> ／ 買掛金:{" "}
            <span className="font-semibold">{fmt(stats.payable)}</span>
          </p>
        </div>
        <Link href="/purchasing/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
          <Plus className="h-4 w-4" />仕入登録
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><FileText className="h-4 w-4" />未支払</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.unpaid}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />期日超過</div><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.overdue}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />7日以内期日</div><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.dueSoon}</p></GlassCard>
        <GlassCard className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="h-4 w-4" />買掛金合計</div><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(stats.payable)}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="伝票番号・発注番号・仕入先" className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {["未完了のみ", "すべて", "未支払", "一部支払", "支払済"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">伝票番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">請求額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">支払済</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">残額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">支払期日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className={cn("border-t border-white/30 hover:bg-white/40", i.daysToDue < 0 && i.status !== "支払済" && "bg-red-500/5")}>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.id}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{i.poNumber}</td>
                <td className="px-3 py-2.5 text-gray-800">{i.supplier}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(i.amount)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{fmt(i.paid)}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums", i.amount - i.paid > 0 ? "text-red-700 font-bold" : "text-gray-400")}>{i.amount - i.paid !== 0 ? fmt(i.amount - i.paid) : "—"}</td>
                <td className={cn("px-3 py-2.5 text-xs tabular-nums", i.daysToDue < 0 && i.status !== "支払済" && "text-red-700 font-semibold")}>
                  {i.dueDate}{i.daysToDue < 0 && i.status !== "支払済" && ` (${i.daysToDue}日)`}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", i.status === "未支払" && "bg-amber-500/15 text-amber-700", i.status === "一部支払" && "bg-yellow-500/15 text-yellow-700", i.status === "支払済" && "bg-emerald-500/15 text-emerald-700")}>
                    {i.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {i.status !== "支払済" ? (
                    <button onClick={() => toast.show(`${i.id} の支払登録を開きます`)} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                      支払登録
                    </button>
                  ) : (
                    <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
