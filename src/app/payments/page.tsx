"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Plus, CheckCircle2, AlertTriangle, CreditCard, Banknote, TrendingUp, Mail } from "lucide-react";

type Pay = {
  id: string;
  order: string;
  customer: string;
  amount: number;
  paid: number;
  method: string;
  status: "未入金" | "一部入金" | "入金済" | "過剰入金";
  due: string;
  daysOverdue: number;
};

const PAYMENTS: Pay[] = [
  { id: "P001", order: "ORD-2026-00849", customer: "田中一郎", amount: 154000, paid: 0, method: "銀行振込", status: "未入金", due: "2026-04-30", daysOverdue: 0 },
  { id: "P002", order: "ORD-2026-00844", customer: "中村あかり", amount: 3200, paid: 0, method: "銀行振込", status: "未入金", due: "2026-04-25", daysOverdue: 3 },
  { id: "P003", order: "ORD-2026-00838", customer: "井上智", amount: 28500, paid: 25000, method: "銀行振込", status: "一部入金", due: "2026-04-20", daysOverdue: 8 },
  { id: "P004", order: "ORD-2026-00835", customer: "木下真由", amount: 45000, paid: 0, method: "請求書払い", status: "未入金", due: "2026-05-31", daysOverdue: 0 },
  { id: "P005", order: "ORD-2026-00830", customer: "山田太郎", amount: 18200, paid: 18200, method: "銀行振込", status: "入金済", due: "2026-04-08", daysOverdue: 0 },
  { id: "P006", order: "ORD-2026-00820", customer: "佐藤花子", amount: 12400, paid: 12800, method: "クレカ", status: "過剰入金", due: "2026-04-15", daysOverdue: 0 },
];

const STATUS_BADGE: Record<Pay["status"], string> = {
  未入金: "bg-red-500/15 text-red-700",
  一部入金: "bg-yellow-500/15 text-yellow-700",
  入金済: "bg-emerald-500/15 text-emerald-700",
  過剰入金: "bg-purple-500/15 text-purple-700",
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function PaymentsPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("未完了のみ");
  const [methodFilter, setMethodFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return PAYMENTS.filter((p) => {
      if (k && !p.order.toLowerCase().includes(k) && !p.customer.toLowerCase().includes(k)) return false;
      if (statusFilter === "未完了のみ" && p.status === "入金済") return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && p.status !== statusFilter) return false;
      if (methodFilter !== "すべて" && p.method !== methodFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, methodFilter]);

  const stats = {
    unpaid: PAYMENTS.filter((p) => p.status === "未入金").length,
    overdue: PAYMENTS.filter((p) => p.daysOverdue > 0).length,
    partial: PAYMENTS.filter((p) => p.status === "一部入金").length,
    receivable: PAYMENTS.filter((p) => p.status !== "入金済").reduce((s, p) => s + (p.amount - p.paid), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金管理</h1>
            <HelpHint>
              受注に対する入金状況を一元管理します。{"\n"}
              未入金・一部入金・過剰入金を判別し、催促メール/再請求/差額調整につなげます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未入金: <span className="font-semibold text-red-700">{stats.unpaid}件</span> ／ 期日超過:{" "}
            <span className="font-semibold text-amber-700">{stats.overdue}件</span> ／ 売掛金:{" "}
            <span className="font-semibold">{fmt(stats.receivable)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/payments/email-confirm"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Mail className="h-4 w-4" />入金確認メール
          </Link>
          <Link
            href="/payments/register/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
          >
            <Plus className="h-4 w-4" />入金登録
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><CreditCard className="h-4 w-4" />未入金</div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.unpaid}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />期日超過</div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.overdue}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Banknote className="h-4 w-4" />一部入金</div>
          <p className="mt-2 text-3xl font-bold text-yellow-700 tabular-nums">{stats.partial}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp className="h-4 w-4" />売掛金合計</div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(stats.receivable)}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["未完了のみ", "すべて", "未入金", "一部入金", "入金済", "過剰入金"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">支払方法</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "銀行振込", "請求書払い", "クレカ", "代引", "コンビニ"].map((o) => <option key={o}>{o}</option>)}
            </select>
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
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">残額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">支払方法</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">期日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-medium text-blue-600">{p.order}</td>
                <td className="px-3 py-2.5 text-gray-800">{p.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(p.amount)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{fmt(p.paid)}</td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums", p.amount - p.paid > 0 ? "text-red-700 font-bold" : "text-gray-400")}>
                  {p.amount - p.paid !== 0 ? fmt(p.amount - p.paid) : "—"}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{p.method}</td>
                <td className={cn("px-3 py-2.5 text-xs tabular-nums", p.daysOverdue > 0 && "text-red-700 font-semibold")}>
                  {p.due}{p.daysOverdue > 0 && ` (+${p.daysOverdue}日)`}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[p.status])}>{p.status}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {p.status !== "入金済" ? (
                    <button
                      onClick={() => toast.show(`${p.order} の入金登録画面を開きます`)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      入金登録
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
