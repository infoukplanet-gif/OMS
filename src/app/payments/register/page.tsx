"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
import { applyRecordPaymentCascade } from "@/lib/cascades/record-payment";
import { paymentStore, type PaymentRecord } from "@/lib/stores/payment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { shipmentStore } from "@/lib/stores/shipment";
import { mailQueue } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { INITIAL_PAYMENTS } from "@/lib/seeds/payments";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";

// 共有 paymentStore のレコードに表示用フィールドが乗ることを許容する型。
type RegisterPayment = PaymentRecord & { customer?: string; method?: string };

// 入金登録の操作履歴（このセッションでの登録アクティビティ。状態の真実は paymentStore 側）。
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

const SEED_LOG: LogEntry[] = [
  {
    id: "PR-2026-0182",
    orderId: "ORD-2026-08820",
    customer: "中村 あかり",
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
    id: "PR-2026-0181",
    orderId: "ORD-2026-08811",
    customer: "井上 智",
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

const toState = (p: PaymentRecord): PaymentState => ({
  status: p.status,
  orderTotal: p.orderTotal,
  paidAmount: p.paidAmount,
  overpaid: p.overpaid,
});

export default function PaymentRegisterPage() {
  const toast = useToast();

  // 共有ストアを seed（入金確認で受注確定→出荷生成→在庫引当まで連鎖させるため
  // payment / order / inventory を揃える）。shipment は cascade 内で生成される。
  // 永続化の所有は payments/page（usePersistentStore）に一任し、ここでは持たない。
  useEffect(() => {
    if (paymentStore.getState().length === 0) paymentStore.setItems(INITIAL_PAYMENTS);
    if (orderStore.getState().length === 0) orderStore.setItems(INITIAL_ORDERS);
    if (inventoryStore.getState().length === 0) inventoryStore.setItems(INITIAL_INVENTORY);
  }, []);

  const payments = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  ) as ReadonlyArray<RegisterPayment>;

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
      overpaidCount: payments.filter((p) => p.overpaid).length,
      logCount: log.length,
    };
  }, [log, payments]);

  const candidatePayment = formOrderId
    ? payments.find((p) => p.orderId === formOrderId.trim())
    : undefined;
  const previewAmount = Number.parseInt(formAmount, 10);
  const previewValid = candidatePayment !== undefined && Number.isFinite(previewAmount) && previewAmount > 0;
  const previewAfter = previewValid && candidatePayment ? recordPayment(toState(candidatePayment), previewAmount) : null;

  const submit = () => {
    if (formOrderId.trim() === "") {
      toast.show("受注番号を入力してください", "error");
      return;
    }
    const before = payments.find((p) => p.orderId === formOrderId.trim());
    if (before === undefined) {
      toast.show("該当する受注が見つかりません", "error");
      return;
    }
    if (!Number.isFinite(previewAmount) || previewAmount <= 0) {
      toast.show("入金額は1円以上の正の整数を入力してください", "error");
      return;
    }

    // 共有 paymentStore へ実反映。完済到達時は受注確定→出荷指示→在庫引当→メールまで連鎖。
    const res = applyRecordPaymentCascade(before.id, previewAmount, {
      paymentStore,
      orderStore,
      shipmentStore,
      inventoryStore,
      mailQueue,
      autoMailEnabled: getAutoMailEnabled(),
    });
    if (!res.applied) {
      toast.show("入金登録に失敗しました（金額不正または既に完済済み）", "error");
      return;
    }

    const after = paymentStore.getState().find((p) => p.id === before.id) ?? before;
    const customer = before.customer ?? "—";
    const paidAt = formPaidAt ? formatDateTime(formPaidAt) : formatDateTime(new Date());
    const entry: LogEntry = {
      id: `PR-${new Date().getFullYear()}-${String(log.length + 200).padStart(4, "0")}`,
      orderId: before.orderId,
      customer,
      amount: previewAmount,
      paidAt,
      method: formMethod,
      bank: formMethod === "銀行振込" ? "三井住友銀行 / 普通 / 1234567" : formMethod,
      by: "佐藤 健",
      beforeStatus: before.status,
      afterStatus: after.status,
      overpaid: after.overpaid,
    };
    setLog((prev) => [entry, ...prev]);

    const detail = [
      `${customer} さま：${before.status} → ${after.status}（${fmt(previewAmount)}）`,
      res.cascadeApplied > 0 ? "受注確定" : "",
      res.shipmentsCreated > 0 ? `出荷指示${res.shipmentsCreated}件作成` : "",
      res.allocated > 0 ? `引当${res.allocated}SKU` : "",
      res.shortageMarked > 0 ? "在庫不足" : "",
      res.enqueued > 0 ? `メール${res.enqueued}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    toast.show(detail, res.shortageMarked > 0 ? "info" : "success");

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
              個別の入金記録を登録します。入力した金額は共有 paymentStore に反映され、完済時は受注確定〜出荷指示〜在庫引当まで自動連鎖します。{"\n"}
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
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象受注</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{payments.length}</p></GlassCard>
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
              placeholder="ORD-2026-08843"
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {formOrderId && candidatePayment === undefined && (
              <p className="mt-1 text-xs text-red-600">対象受注が見つかりません</p>
            )}
            {candidatePayment !== undefined && (
              <p className="mt-1 text-xs text-gray-500">
                {candidatePayment.customer ?? "—"} さま ／ 受注金額 {fmt(candidatePayment.orderTotal)} ／ 入金済 {fmt(candidatePayment.paidAmount)}
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
            "「入金済み」到達時は applyRecordPaymentCascade が受注確定（confirmPayment）を連鎖発火",
            "受注確定に伴い出荷指示を自動作成・在庫を引当（不足時は在庫不足マーク）",
            "顧客への入金完了メールを送信（メールONの場合）",
            "差額発生時は overpaid フラグを立てる",
            "操作内容を入金登録ログに記録",
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
