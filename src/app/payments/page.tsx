"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  type PaymentStatus,
  PAYMENT_STATUSES,
  paymentStatusBadge,
} from "@/lib/state-machines/payment";
import { mailQueue } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { applyRecordPaymentCascade } from "@/lib/cascades/record-payment";
import { downloadCsv } from "@/lib/export/csv";
import { applyCancelOrderCascade } from "@/lib/cascades/cancel-order";
import { extractCancelCandidates } from "@/lib/payments/cancel-candidates";
import { paymentStore } from "@/lib/stores/payment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { shipmentStore } from "@/lib/stores/shipment";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { INITIAL_PAYMENTS, type SeededPayment } from "@/lib/seeds/payments";
import type { AllocationLine } from "@/lib/state-machines/inventory";
import {
  scheduleOverdueReminders,
  type OverduePayment,
} from "@/lib/mail/payment-scheduler";
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  TrendingUp,
  Mail,
  Ban,
} from "lucide-react";

/** ページ内で扱う入金レコード型（共有シードの型を再利用）。 */
type PayRecord = SeededPayment;

const fmt = (n: number) => `¥${n.toLocaleString()}`;

/** タブ定義: "all" | "overpaid" | PaymentStatus */
type TabValue = "all" | "overpaid" | PaymentStatus;

const TABS: { label: string; value: TabValue }[] = [
  { label: "すべて", value: "all" },
  ...PAYMENT_STATUSES.map((s) => ({ label: s, value: s as TabValue })),
  { label: "過剰入金", value: "overpaid" },
];

export default function PaymentsPage() {
  const toast = useToast();

  // shared paymentStore を購読。実 cascade（confirmPayment / revertToPaymentWait）と
  // 在庫引当を画面横断で反映するためにシードする。
  // orderStore も seed しないと、payments 画面から先に入った場合の cascade で
  // 対象 order が見つからず silently no-op する（E2E で検出）。
  useEffect(() => {
    if (paymentStore.getState().length === 0) {
      paymentStore.setItems(INITIAL_PAYMENTS);
    }
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
    if (orderStore.getState().length === 0) {
      orderStore.setItems(INITIAL_ORDERS);
    }
  }, []);
  const storeItems = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  );
  const payments = storeItems as ReadonlyArray<PayRecord>;

  // orderStore も購読し、キャンセル候補からキャンセル済み受注を除外する
  // （キャンセル時の返金で paidAmount が 0 に戻るため、payment だけ見ると候補に残り続ける）。
  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS,
  );
  const cancelledOrderIds = useMemo(
    () => new Set(orders.filter((o) => o.status === "キャンセル").map((o) => o.id)),
    [orders],
  );

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("すべて");
  // 入金登録ダイアログ: 対象レコードと入力中の金額（一部入金に対応）
  const [recordTarget, setRecordTarget] = useState<PayRecord | null>(null);
  const [recordAmount, setRecordAmount] = useState("");

  // ---- フィルタリング --------------------------------------------------------
  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return payments.filter((p) => {
      if (k && !p.order.toLowerCase().includes(k) && !p.customer.toLowerCase().includes(k)) {
        return false;
      }
      if (activeTab === "overpaid" && !p.overpaid) return false;
      if (activeTab !== "all" && activeTab !== "overpaid" && p.status !== activeTab) return false;
      if (methodFilter !== "すべて" && p.method !== methodFilter) return false;
      return true;
    });
  }, [payments, keyword, activeTab, methodFilter]);

  // ---- KPI 統計 -------------------------------------------------------------
  const stats = useMemo(() => ({
    unpaid:     payments.filter((p) => p.status === "未入金").length,
    overdue:    payments.filter((p) => p.daysOverdue > 0).length,
    partial:    payments.filter((p) => p.status === "一部入金").length,
    overpaid:   payments.filter((p) => p.overpaid).length,
    receivable: payments
      .filter((p) => p.status !== "入金済み")
      .reduce((s, p) => s + (p.orderTotal - p.paidAmount), 0),
  }), [payments]);

  // ---- キャンセル候補（期日7日超過の未完済） ----------------------------------
  // 最終催告（payment-final-call-7d）と同じ閾値。実キャンセルは applyCancelOrderCascade に委譲。
  const cancelCandidates = useMemo(
    () =>
      extractCancelCandidates(
        payments
          .filter((p) => !cancelledOrderIds.has(p.orderId))
          .map((p) => ({
            paymentId: p.id,
            orderId: p.orderId,
            customer: p.customer,
            due: p.due,
            paidAmount: p.paidAmount,
            orderTotal: p.orderTotal,
          })),
        new Date(),
      ),
    [payments, cancelledOrderIds],
  );

  // ---- 入金登録（共有 record-payment cascade） --------------------------------
  /**
   * 入金記録〜受注確定〜出荷生成〜在庫引当の連鎖は applyRecordPaymentCascade に集約。
   * payments/bulk（一括消込）と同一ロジックを共有する。
   */
  function handleRecordPayment(id: string, amount: number) {
    return applyRecordPaymentCascade(id, amount, {
      paymentStore,
      orderStore,
      shipmentStore,
      inventoryStore,
      mailQueue,
      autoMailEnabled: getAutoMailEnabled(),
    });
  }

  // ---- 入金取消（paymentStore + 実 cascade） -----------------------------------
  /**
   * paymentStore.applyCancel で SM 遷移 + handler effects を取得。
   * 当該受注の現在ステータスを orderStore から引いて revert 判定に渡す。
   * 巻き戻しが走った場合、order-handlers が releaseInventory を emit するので
   * inventoryStore.applyRelease に流して引当を解放する。
   */
  function handleCancelPayment(id: string, amount: number): {
    cascadeApplied: number;
    released: number;
  } {
    const payment = paymentStore.getState().find((p) => p.id === id);
    const orderStatus = payment
      ? orderStore.getState().find((o) => o.id === payment.orderId)?.status
      : undefined;

    const result = paymentStore.applyCancel(id, amount, { orderStatus });
    let cascadeApplied = 0;
    let released = 0;

    if (!result.applied) return { cascadeApplied, released };

    if (result.effects.cascadeOrderAction) {
      const orderRes = orderStore.applyTransition(
        result.effects.cascadeOrderAction.orderId,
        result.effects.cascadeOrderAction.action,
      );
      if (orderRes.applied) cascadeApplied += 1;
      // revertToPaymentWait で order が引当待ち→入金待ちに戻ると inventoryShortage が
      // クリアされるが、現状 SM は releaseInventory を emit しない設計（引当はそのまま）。
      // ここでは念のため effects.releaseInventory をチェックして在庫を戻す。
      if (orderRes.effects.releaseInventory) {
        const sharedOrder = orderStore
          .getState()
          .find((o) => o.id === orderRes.effects.releaseInventory!.orderId);
        const allocation = sharedOrder?.allocation as AllocationLine[] | undefined;
        if (allocation && allocation.length > 0) {
          const cascade = inventoryStore.applyRelease(allocation);
          released += cascade.appliedCount;
        }
      }
    }

    return { cascadeApplied, released };
  }

  // ---- 操作ボタン処理 ---------------------------------------------------------
  /** 入金登録ダイアログを開く。初期値は残額（全額入金が既定、編集で一部入金可）。 */
  function onClickRecord(p: PayRecord) {
    const remaining = p.orderTotal - p.paidAmount;
    if (remaining <= 0) {
      toast.show(`${p.order} はすでに全額入金済みです`);
      return;
    }
    setRecordTarget(p);
    setRecordAmount(String(remaining));
  }

  /** ダイアログで確定された入金額で cascade を実行する。 */
  function confirmRecord() {
    const p = recordTarget;
    if (!p) return;
    const amount = Math.round(Number(recordAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.show("入金額は1円以上で入力してください", "info");
      return;
    }
    const result = handleRecordPayment(p.id, amount);
    const remaining = p.orderTotal - p.paidAmount;
    const isPartial = amount < remaining;
    const mailDetail = [
      result.enqueued > 0 ? `enqueue ${result.enqueued}件` : "",
      result.duplicateSkipped > 0 ? `重複 ${result.duplicateSkipped}件` : "",
      result.disabledSkipped > 0 ? `無効化 ${result.disabledSkipped}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const mailLine = mailDetail ? ` / メール ${mailDetail}` : "";
    const cascadeDetail = [
      result.cascadeApplied > 0 ? `受注確定 ${result.cascadeApplied}件` : "",
      result.shipmentsCreated > 0 ? `出荷指示 ${result.shipmentsCreated}件作成` : "",
      result.allocated > 0 ? `引当 ${result.allocated}SKU` : "",
      result.shortageMarked > 0 ? `在庫不足マーク ${result.shortageMarked}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const cascadeLine = cascadeDetail ? ` / ${cascadeDetail}` : "";
    const kindLabel = isPartial ? "一部入金" : amount > remaining ? "過剰入金" : "入金登録";

    toast.show(
      `${p.order}: ${fmt(amount)} を${kindLabel}しました${cascadeLine}${mailLine}`,
      result.shortageMarked > 0 ? "info" : "success",
    );
    setRecordTarget(null);
    setRecordAmount("");
  }

  /**
   * 期日超過の未入金/一部入金に対し、scheduleOverdueReminders で
   * payment-reminder-3d / payment-final-call-7d を生成し mailQueue に enqueue。
   * dedupeKey で同一トリガの重複送信は抑止される。
   */
  function sendOverdueReminders(): void {
    const overdue: OverduePayment[] = payments.map((p) => ({
      paymentId: p.id,
      orderId: p.orderId,
      due: p.due,
      paidAmount: p.paidAmount,
      orderTotal: p.orderTotal,
    }));
    const jobs = scheduleOverdueReminders(overdue, new Date());

    if (jobs.length === 0) {
      toast.show("期日超過の催促対象はありません", "info");
      return;
    }

    const result = mailQueue.enqueueAll(jobs, getAutoMailEnabled());
    const tail = [
      result.enqueued > 0 ? `送信 ${result.enqueued}件` : "",
      result.duplicateSkipped > 0 ? `重複 ${result.duplicateSkipped}件` : "",
      result.disabledSkipped > 0 ? `無効化 ${result.disabledSkipped}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    toast.show(
      result.enqueued > 0
        ? `催促メール ${tail}`
        : `催促対象はありますが ${tail}（送信なし）`,
      result.enqueued > 0 ? "success" : "info",
    );
  }

  /**
   * キャンセル候補の受注を実キャンセルする。applyCancelOrderCascade で
   * 受注キャンセル遷移 → 引当解放 → 入金済み分の全額返金 → キャンセル通知メールまで連鎖。
   * 入金管理画面からも受注ライフサイクルの巻き戻しを一気通貫で起動できる。
   */
  function onCancelCandidate(orderId: string) {
    const result = applyCancelOrderCascade(orderId, {
      orderStore,
      paymentStore,
      inventoryStore,
      mailQueue,
      autoMailEnabled: getAutoMailEnabled(),
    });
    if (!result.applied) {
      toast.show(`${orderId} はキャンセルできない状態です（出荷済み以降は返品フロー）`, "error");
      return;
    }
    const tail = [
      result.released > 0 ? `引当戻し ${result.released}SKU` : "",
      result.refunded ? `返金 ${fmt(result.refundedAmount)}` : "",
      result.enqueued > 0 ? `キャンセル通知メール ${result.enqueued}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const line = tail ? ` / ${tail}` : "";
    toast.show(`${orderId} をキャンセルしました${line}`, "info");
  }

  function onClickCancel(p: PayRecord) {
    if (p.paidAmount <= 0) {
      toast.show(`${p.order} には取消できる入金がありません`);
      return;
    }
    const { cascadeApplied, released } = handleCancelPayment(p.id, p.paidAmount);
    const tail = [
      cascadeApplied > 0 ? `受注「引当待ち→入金待ち」連鎖 ${cascadeApplied}件` : "",
      released > 0 ? `引当戻し ${released}SKU` : "",
    ]
      .filter(Boolean)
      .join("・");
    const line = tail ? ` / ${tail}` : "";
    toast.show(`${p.order}: 入金 ${fmt(p.paidAmount)} を全取消しました${line}`, "info");
  }

  // ---- バッジ表示（overpaid 行は特別扱い） ------------------------------------
  function statusBadgeClass(p: PayRecord): string {
    if (p.overpaid) return "bg-purple-500/15 text-purple-700";
    return paymentStatusBadge[p.status];
  }

  function statusLabel(p: PayRecord): string {
    if (p.overpaid) return "過剰入金";
    return p.status;
  }

  /** 現在の絞り込み結果を CSV でダウンロードする。 */
  function exportFilteredCsv() {
    if (filtered.length === 0) {
      toast.show("出力対象の入金データがありません", "info");
      return;
    }
    const headers = [
      "受注番号", "顧客", "決済方法", "受注金額", "入金額", "残額", "期日", "超過日数", "状態",
    ];
    const rows = filtered.map((p) => [
      p.order,
      p.customer,
      p.method,
      p.orderTotal,
      p.paidAmount,
      p.orderTotal - p.paidAmount,
      p.due,
      p.daysOverdue,
      statusLabel(p),
    ]);
    downloadCsv(`入金一覧_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    toast.show(`${filtered.length}件の入金データをCSV出力しました`, "success");
  }

  return (
    <div className="space-y-5">
      {/* ---- ヘッダー -------------------------------------------------------- */}
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            <Mail className="h-4 w-4" />入金確認メール
          </Link>
          <Link
            href="/payments/register/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
          >
            <Plus className="h-4 w-4" />入金登録
          </Link>
        </div>
      </div>

      {/* ---- KPIカード ------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CreditCard className="h-4 w-4" />未入金
          </div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.unpaid}</p>
          <p className="mt-1 text-xs text-gray-400">件</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />期日超過
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.overdue}</p>
          <p className="mt-1 text-xs text-gray-400">件</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Banknote className="h-4 w-4" />一部入金 / 過剰入金
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-700 tabular-nums">{stats.partial}</p>
          <p className="mt-1 text-xs text-gray-400">
            件（過剰: <span className="text-purple-700">{stats.overpaid}</span>件）
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />売掛金合計
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{fmt(stats.receivable)}</p>
          <p className="mt-1 text-xs text-gray-400">未収残高</p>
        </GlassCard>
      </div>

      {/* ---- キャンセル候補（期日7日超過の未入金/一部入金） ------------------- */}
      {cancelCandidates.length > 0 && (
        <GlassCard className="p-0 overflow-hidden border-red-200/60">
          <div className="px-4 py-3 border-b border-white/40 bg-red-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">キャンセル候補</span>
              <HelpHint>
                入金期日を7日以上超過した未入金/一部入金の受注です。最終催告メールの対象でもあります。{"\n"}
                キャンセルすると引当済み在庫の解放・入金済み分の全額返金・キャンセル通知メールまで自動で連鎖します。
              </HelpHint>
            </div>
            <span className="text-xs text-red-700">{cancelCandidates.length} 件</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">受注番号</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">顧客</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">超過日数</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">未回収残額</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {cancelCandidates.map((c) => (
                <tr key={c.paymentId} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/orders/${c.orderId}/edit`} className="text-blue-700 hover:underline font-medium">
                      {c.orderId}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{c.customer}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-red-700 font-semibold">{c.daysOverdue}日</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(c.outstanding)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onCancelCandidate(c.orderId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/80 text-white border border-red-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-red-500/90"
                    >
                      <Ban className="h-3.5 w-3.5" />キャンセル
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* ---- ステータスタブ -------------------------------------------------- */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-white/80 text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40",
            )}
          >
            {tab.label}
            {tab.value === "overpaid" && stats.overpaid > 0 && (
              <span className="ml-1 text-xs text-purple-700">({stats.overpaid})</span>
            )}
          </button>
        ))}
      </div>

      {/* ---- フィルタ行 ------------------------------------------------------ */}
      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">支払方法</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "銀行振込", "請求書払い", "クレカ", "代引", "コンビニ"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 self-end pb-1">
            {filtered.length} 件表示
          </p>
        </div>
      </GlassCard>

      {/* ---- テーブル -------------------------------------------------------- */}
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">受注額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">入金額</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">残額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">支払方法</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">期日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">
                  該当する入金レコードがありません
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const balance = p.orderTotal - p.paidAmount;
                return (
                  <tr key={p.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-blue-600">{p.order}</td>
                    <td className="px-3 py-2.5 text-gray-800">{p.customer}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(p.orderTotal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{fmt(p.paidAmount)}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right tabular-nums",
                        balance > 0 ? "text-red-700 font-bold" : p.overpaid ? "text-purple-700 font-bold" : "text-gray-400",
                      )}
                    >
                      {balance !== 0 ? fmt(Math.abs(balance)) : "—"}
                      {p.overpaid && <span className="ml-0.5 text-xs">(超過)</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{p.method}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-xs tabular-nums",
                        p.daysOverdue > 0 && "text-red-700 font-semibold",
                      )}
                    >
                      {p.due}
                      {p.daysOverdue > 0 && ` (+${p.daysOverdue}日)`}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusBadgeClass(p),
                        )}
                      >
                        {statusLabel(p)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status !== "入金済み" || p.overpaid ? (
                          <button
                            onClick={() => onClickRecord(p)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                          >
                            入金登録
                          </button>
                        ) : (
                          <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                        )}
                        {p.paidAmount > 0 && (
                          <button
                            onClick={() => onClickCancel(p)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* ---- フッター: 一括操作 ---------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={sendOverdueReminders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
            title="3日超過は催促メール / 7日超過は最終催告を mailQueue に enqueue"
          >
            <Mail className="h-4 w-4" />催促メール一括送信
          </button>
          <button
            onClick={exportFilteredCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            CSV出力
          </button>
        </div>
        <p className="text-xs text-gray-400">
          全 {payments.length} 件 / 表示 {filtered.length} 件
        </p>
      </div>

      {/* ---- 入金登録ダイアログ（一部入金対応） ------------------------------- */}
      {recordTarget && (() => {
        const remaining = recordTarget.orderTotal - recordTarget.paidAmount;
        const amount = Math.round(Number(recordAmount));
        const valid = Number.isFinite(amount) && amount > 0;
        const isPartial = valid && amount < remaining;
        const isOver = valid && amount > remaining;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-6">
              <div className="flex items-start gap-3">
                <Banknote className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-800">入金登録</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {recordTarget.order}（{recordTarget.customer}）
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-white/60 border border-white/50 px-3 py-2">
                      <p className="text-xs text-gray-500">受注金額</p>
                      <p className="font-semibold tabular-nums">{fmt(recordTarget.orderTotal)}</p>
                    </div>
                    <div className="rounded-xl bg-white/60 border border-white/50 px-3 py-2">
                      <p className="text-xs text-gray-500">入金残額</p>
                      <p className="font-semibold tabular-nums text-blue-700">{fmt(remaining)}</p>
                    </div>
                  </div>

                  <label className="block mt-4 text-sm font-medium text-gray-700">入金額（円）</label>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    autoFocus
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm tabular-nums bg-white/70 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordAmount(String(remaining))}
                      className="px-2.5 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
                    >
                      全額（{fmt(remaining)}）
                    </button>
                    {[Math.round(remaining / 2)].filter((v) => v > 0 && v < remaining).map((half) => (
                      <button
                        key={half}
                        type="button"
                        onClick={() => setRecordAmount(String(half))}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80"
                      >
                        半額（{fmt(half)}）
                      </button>
                    ))}
                  </div>

                  {isPartial && (
                    <p className="mt-2 text-xs text-amber-700">
                      一部入金として記録します（残額 {fmt(remaining - amount)} は未入金のまま）。
                    </p>
                  )}
                  {isOver && (
                    <p className="mt-2 text-xs text-purple-700">
                      残額を超える金額です。過剰入金として記録され、差額調整の対象になります。
                    </p>
                  )}

                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => { setRecordTarget(null); setRecordAmount(""); }}
                      className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={confirmRecord}
                      disabled={!valid}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      入金登録
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
