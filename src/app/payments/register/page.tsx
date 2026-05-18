"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  Search,
  Banknote,
  History,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  recordPayment,
  paymentStatusBadge,
  type PaymentState,
} from "@/lib/state-machines/payment";

type LogEntry = {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  paidAt: string;
  method: string;
  bank: string;
  by: string;
  beforeStatus: PaymentState["status"];
  afterStatus: PaymentState["status"];
  overpaid: boolean;
};

const SEED_PAYMENTS: ReadonlyArray<[string, PaymentState & { customer: string }]> = [
  ["ORD-2026-00849", { status: "未入金", orderTotal: 154000, paidAmount: 0, overpaid: false, customer: "田中一郎" }],
  ["ORD-2026-00838", { status: "一部入金", orderTotal: 28500, paidAmount: 25000, overpaid: false, customer: "井上智" }],
  ["ORD-2026-00835", { status: "未入金", orderTotal: 45000, paidAmount: 0, overpaid: false, customer: "木下真由" }],
  ["ORD-2026-00830", { status: "未入金", orderTotal: 18200, paidAmount: 0, overpaid: false, customer: "山田太郎" }],
  ["ORD-2026-00824", { status: "未入金", orderTotal: 38400, paidAmount: 0, overpaid: false, customer: "佐藤花子" }],
];

const SEED_LOG: LogEntry[] = [
  {
    id: "PR-2026-0182",
    orderId: "ORD-2026-00820",
    customer: "中村あかり",
    amount: 12800,
    paidAt: "2026-04-24 16:18",
    method: "クレカ",
    bank: "Stripe",
    by: "システム",
    beforeStatus: "未入金",
    afterStatus: "入金済み",
    overpaid: false,
  },
  {
    id: "PR-2026-0180",
    orderId: "ORD-2026-00800",
    customer: "高橋健",
    amount: 8400,
    paidAt: "2026-04-23 09:00",
    method: "代引",
    bank: "ヤマト集金",
    by: "システム",
    beforeStatus: "未入金",
    afterStatus: "入金済み",
    overpaid: false,
  },
  {
    id: "PR-2026-0181",
    orderId: "ORD-2026-00811",
    customer: "井上智",
    amount: 25000,
    paidAt: "2026-04-24 14:08",
    method: "銀行振込",
    bank: "みずほ銀行 / 当座 / 0987654",
    by: "鈴木 美咲",
    beforeStatus: "未入金",
    afterStatus: "一部入金",
    overpaid: false,
  },
];

const PAYMENT_METHODS = ["銀行振込", "クレカ", "代引", "コンビニ", "ペイディ"] as const;
const fmt = (n: number) => `¥${n.toLocaleString()}`;
const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export default function PaymentRegisterPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<Map<string, PaymentState & { customer: string }>>(
    () => new Map(SEED_PAYMENTS.map(([k, v]) => [k, { ...v }])),
  );
  const [log, setLog] = useState<LogEntry[]>(SEED_LOG);
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState<"すべて" | (typeof PAYMENT_METHODS)[number]>("すべて");

  const [formOrderId, setFormOrderId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPaidAt, setFormPaidAt] = useState<Date | null>(new Date());
  const [formMethod, setFormMethod] = useState<(typeof PAYMENT_METHODS)[number]>("銀行振込");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return log.filter((r) => {
      if (k && !r.orderId.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k) && !r.id.toLowerCase().includes(k)) return false;
      if (methodFilter !== "すべて" && r.method !== methodFilter) return false;
      return true;
    });
  }, [log, keyword, methodFilter]);

  const stats = useMemo(() => {
    const total = log.reduce((s, r) => s + r.amount, 0);
    return {
      total,
      todayCount: log.filter((r) => r.paidAt.startsWith(formatDateTime(new Date()).slice(0, 10))).length,
      overpaidCount: log.filter((r) => r.overpaid).length,
      logCount: log.length,
    };
  }, [log]);

  const candidatePayment = formOrderId ? payments.get(formOrderId.trim()) : undefined;
  const previewAmount = Number.parseInt(formAmount, 10);
  const previewValid = candidatePayment !== undefined && Number.isFinite(previewAmount) && previewAmount > 0;
  const previewAfter = previewValid && candidatePayment ? recordPayment(candidatePayment, previewAmount) : null;

  const submit = () => {
    if (formOrderId.trim() === "") {
      toast.show("受注番号を入力してください", "error");
      return;
    }
    const current = payments.get(formOrderId.trim());
    if (current === undefined) {
      toast.show("該当する受注が見つかりません", "error");
      return;
    }
    if (!Number.isFinite(previewAmount) || previewAmount <= 0) {
      toast.show("入金額は1円以上の正の整数を入力してください", "error");
      return;
    }
    const next = recordPayment(current, previewAmount);
    if (next === current) {
      toast.show("入金登録に失敗しました", "error");
      return;
    }
    const paidAt = formPaidAt ? formatDateTime(formPaidAt) : formatDateTime(new Date());
    const entry: LogEntry = {
      id: `PR-${new Date().getFullYear()}-${String(log.length + 200).padStart(4, "0")}`,
      orderId: formOrderId.trim(),
      customer: current.customer,
      amount: previewAmount,
      paidAt,
      method: formMethod,
      bank: formMethod === "銀行振込" ? "三井住友銀行 / 普通 / 1234567" : formMethod,
      by: "佐藤 健",
      beforeStatus: current.status,
      afterStatus: next.status,
      overpaid: next.overpaid,
    };

    setPayments((prev) => {
      const m = new Map(prev);
      m.set(formOrderId.trim(), { ...next, customer: current.customer });
      return m;
    });
    setLog((prev) => [entry, ...prev]);
    toast.show(`${current.customer} さま：${current.status} → ${next.status}（${fmt(previewAmount)}）`, "success");

    setFormOrderId("");
    setFormAmount("");
    setFormPaidAt(new Date());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">入金登録</h1>
            <HelpHint>
              個別の入金記録を登録します。入力した金額は `recordPayment` 経由で受注の入金状態を更新します。{"\n"}
              CSV取込で一括登録したい場合は「一括入金処理」を使用してください。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            登録済み: <span className="font-semibold">{stats.logCount}件</span> ／ 過剰入金:{" "}
            <span className="font-semibold text-purple-700">{stats.overpaidCount}件</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">本日の登録</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.todayCount}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">登録合計額</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{fmt(stats.total)}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">過剰入金</p><p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">{stats.overpaidCount}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象受注</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{payments.size}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-semibold text-gray-800">新規入金登録</h2>
          <HelpHint>受注番号と入金額を入力すると、リアルタイムで遷移後の入金ステータスをプレビューします。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">受注番号</label>
            <input
              value={formOrderId}
              onChange={(e) => setFormOrderId(e.target.value)}
              placeholder="ORD-2026-00849"
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {formOrderId && candidatePayment === undefined && (
              <p className="mt-1 text-xs text-red-600">対象受注が見つかりません</p>
            )}
            {candidatePayment !== undefined && (
              <p className="mt-1 text-xs text-gray-500">
                {candidatePayment.customer} さま ／ 受注金額 {fmt(candidatePayment.orderTotal)} ／ 入金済 {fmt(candidatePayment.paidAmount)}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500">入金額</label>
            <input
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              inputMode="numeric"
              placeholder="10000"
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">入金日</label>
            <DatePicker compact placeholder="入金日" onChange={(d) => setFormPaidAt(d ?? null)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">支払方法</label>
            <select
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {previewAfter && candidatePayment ? (
              <>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", paymentStatusBadge[candidatePayment.status])}>
                  {candidatePayment.status}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", paymentStatusBadge[previewAfter.status])}>
                  {previewAfter.status}
                </span>
                <span className="text-xs text-gray-500">
                  入金済 {fmt(previewAfter.paidAmount)} / {fmt(candidatePayment.orderTotal)}
                </span>
                {previewAfter.overpaid && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700">過剰入金</span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">受注番号と入金額を入力すると遷移をプレビュー</span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!previewValid}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              previewValid
                ? "bg-blue-500/80 border-blue-400/50 text-white hover:bg-blue-500/90"
                : "bg-gray-200/50 border-gray-200/40 text-gray-400 cursor-not-allowed",
            )}
          >
            <CheckCircle2 className="h-4 w-4" />入金を登録
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="登録ID・受注番号・顧客名"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">支払方法</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", ...PAYMENT_METHODS].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/30">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">入金登録ログ</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">入金額</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金日時</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">方法</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入金元</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録者</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">遷移</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.id}</td>
                <td className="px-3 py-2.5 font-medium text-blue-600">{r.orderId}</td>
                <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-medium">{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums">{r.paidAt}</td>
                <td className="px-3 py-2.5 text-center text-xs">{r.method}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.bank}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{r.by}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", paymentStatusBadge[r.beforeStatus])}>
                      {r.beforeStatus}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", paymentStatusBadge[r.afterStatus])}>
                      {r.afterStatus}
                    </span>
                    {r.overpaid && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-700">過</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-sm text-gray-400">該当する登録がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">登録時の自動処理</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "recordPayment(state, amount) で paidAmount を加算し status を再計算",
            "「入金済み」到達時は onPaymentTransitioned が cascadeOrderAction(confirmPayment) を発行",
            "売掛金台帳から該当行を消込",
            "顧客への入金完了メールを送信（メールONの場合）",
            "差額発生時は「金額不整合」へ自動移動・overpaid フラグを立てる",
            "監査ログに登録",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <Banknote className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
