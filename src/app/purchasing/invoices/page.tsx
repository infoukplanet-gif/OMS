"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Plus, Banknote, AlertTriangle, FileText, CheckCircle2, X } from "lucide-react";
import { payableStore } from "@/lib/stores/payable";
import { summarizePayables, type PayableSummary } from "@/lib/calculations/payable-recognition";
import { INITIAL_PAYABLE_ACCRUALS, INITIAL_PAYABLE_PAYMENTS } from "@/lib/seeds/payables";

const fmt = (n: number) => `¥${n.toLocaleString()}`;
const fmtYMD = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

/** 支払サイト: 計上日から 30 日後を支払期日とする（v1 一律）。 */
const PAYMENT_TERM_DAYS = 30;

const addDays = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split("/").map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + days);
  return fmtYMD(base);
};

/** `target` が `from` の何日後か（負なら過去 = 期日超過）。 */
const daysUntil = (target: string, from: string): number => {
  const [ty, tm, td] = target.split("/").map(Number);
  const [fy, fm, fd] = from.split("/").map(Number);
  return Math.round(
    (new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000,
  );
};

interface PayableRow extends PayableSummary {
  /** 支払期日（計上日 + サイト）。 */
  dueDate: string;
  /** 今日から支払期日までの日数（負 = 超過）。 */
  daysToDue: number;
}

export default function PurchasingInvoicesPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未完了のみ");
  const [payTarget, setPayTarget] = useState<PayableRow | null>(null);
  const [payInput, setPayInput] = useState("");

  // 初回マウントで買掛金台帳＋仕入支払台帳のシードを投入する。
  useEffect(() => {
    if (payableStore.getState().length === 0 && payableStore.getPayments().length === 0) {
      payableStore.setItems(INITIAL_PAYABLE_ACCRUALS);
      payableStore.setPayments(INITIAL_PAYABLE_PAYMENTS);
    }
  }, []);

  const accruals = useSyncExternalStore(
    (cb) => payableStore.subscribe(cb),
    () => payableStore.getState(),
    () => INITIAL_PAYABLE_ACCRUALS,
  );
  const payments = useSyncExternalStore(
    (cb) => payableStore.subscribe(cb),
    () => payableStore.getPayments(),
    () => INITIAL_PAYABLE_PAYMENTS,
  );

  const today = fmtYMD(new Date());

  const rows = useMemo<PayableRow[]>(() => {
    return summarizePayables(accruals, payments).map((s) => {
      const dueDate = addDays(s.lastAccruedAt, PAYMENT_TERM_DAYS);
      return { ...s, dueDate, daysToDue: daysUntil(dueDate, today) };
    });
  }, [accruals, payments, today]);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.poId.toLowerCase().includes(k) && !r.supplier.toLowerCase().includes(k))
        return false;
      if (statusFilter === "未完了のみ" && r.status === "支払済") return false;
      if (statusFilter !== "未完了のみ" && statusFilter !== "すべて" && r.status !== statusFilter)
        return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  const stats = {
    unpaid: rows.filter((r) => r.status === "未払").length,
    overdue: rows.filter((r) => r.daysToDue < 0 && r.remaining > 0).length,
    payable: rows.reduce((s, r) => s + r.remaining, 0),
    dueSoon: rows.filter((r) => r.daysToDue >= 0 && r.daysToDue <= 7 && r.remaining > 0).length,
  };

  const openPay = (r: PayableRow) => {
    setPayTarget(r);
    setPayInput(String(r.remaining));
  };

  const confirmPay = () => {
    const r = payTarget;
    if (!r) return;
    const raw = Math.round(Number(payInput));
    const amount = Number.isFinite(raw) ? Math.min(Math.max(0, raw), r.remaining) : 0;
    if (amount <= 0) {
      toast.show("支払額を1円以上入力してください", "info");
      return;
    }
    payableStore.recordPayment({ poId: r.poId, amount, paidAt: today });
    const full = amount >= r.remaining;
    toast.show(
      `${r.poId} に ${fmt(amount)} を支払登録${full ? "（完済）" : "（一部支払）"}`,
      "success",
    );
    setPayTarget(null);
    setPayInput("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">仕入伝票管理</h1>
            <HelpHint>
              発注入荷で計上された買掛金（仕入債務）を発注単位で集計し、支払予定・支払済を追跡します。入荷の都度、受領分が自動計上されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未払: <span className="font-semibold text-amber-700">{stats.unpaid}件</span> ／ 期日超過:{" "}
            <span className="font-semibold text-red-700">{stats.overdue}件</span> ／ 買掛金:{" "}
            <span className="font-semibold">{fmt(stats.payable)}</span>
          </p>
        </div>
        <Link
          href="/purchasing/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
        >
          <Plus className="h-4 w-4" />
          仕入登録
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />未払
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.unpaid}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />期日超過
          </div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.overdue}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />7日以内期日
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.dueSoon}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />買掛金合計
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(stats.payable)}</p>
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
              placeholder="発注番号・仕入先"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["未完了のみ", "すべて", "未払", "一部支払", "支払済"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">計上額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">支払済</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">残額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">支払期日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.poId}
                className={cn(
                  "border-t border-white/30 hover:bg-white/40",
                  r.daysToDue < 0 && r.remaining > 0 && "bg-red-500/5",
                )}
              >
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.poId}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.supplier}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.accrued)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{fmt(r.paid)}</td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-right tabular-nums",
                    r.remaining > 0 ? "text-red-700 font-bold" : "text-gray-400",
                  )}
                >
                  {r.remaining > 0 ? fmt(r.remaining) : "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-xs tabular-nums",
                    r.daysToDue < 0 && r.remaining > 0 && "text-red-700 font-semibold",
                  )}
                >
                  {r.dueDate}
                  {r.daysToDue < 0 && r.remaining > 0 && ` (${r.daysToDue}日)`}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.status === "未払" && "bg-amber-500/15 text-amber-700",
                      r.status === "一部支払" && "bg-yellow-500/15 text-yellow-700",
                      r.status === "支払済" && "bg-emerald-500/15 text-emerald-700",
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {r.status !== "支払済" ? (
                    <button
                      onClick={() => openPay(r)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                    >
                      支払登録
                    </button>
                  ) : (
                    <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400">
                  該当する買掛金はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      {payTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={() => setPayTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">仕入支払登録</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {payTarget.poId}・{payTarget.supplier}
                </p>
              </div>
              <button
                onClick={() => setPayTarget(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-white/60"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white/50 border border-white/50 p-3">
                <p className="text-xs text-gray-500">計上額</p>
                <p className="mt-1 font-semibold tabular-nums text-gray-800">{fmt(payTarget.accrued)}</p>
              </div>
              <div className="rounded-xl bg-white/50 border border-white/50 p-3">
                <p className="text-xs text-gray-500">支払済</p>
                <p className="mt-1 font-semibold tabular-nums text-emerald-700">{fmt(payTarget.paid)}</p>
              </div>
              <div className="rounded-xl bg-white/50 border border-white/50 p-3">
                <p className="text-xs text-gray-500">残額</p>
                <p className="mt-1 font-bold tabular-nums text-red-700">{fmt(payTarget.remaining)}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500">今回支払額（円）</label>
              <input
                type="number"
                inputMode="numeric"
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                min={0}
                max={payTarget.remaining}
                className="mt-1 w-full h-10 px-3 rounded-xl text-sm tabular-nums bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                残額（{fmt(payTarget.remaining)}）を上限に一部支払も登録できます。支払日は本日（{today}）。
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/50 border border-white/50 text-gray-600 hover:bg-white/70"
              >
                キャンセル
              </button>
              <button
                onClick={confirmPay}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
              >
                <Banknote className="h-4 w-4" />
                支払登録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
