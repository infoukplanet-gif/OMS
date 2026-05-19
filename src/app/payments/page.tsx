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
  paymentStatusOf,
} from "@/lib/state-machines/payment";
import { mailQueue, type MailJob } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { paymentStore, type PaymentRecord } from "@/lib/stores/payment";
import { orderStore } from "@/lib/stores/orders";
import { inventoryStore } from "@/lib/stores/inventory";
import { shipmentStore } from "@/lib/stores/shipment";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
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
} from "lucide-react";

/** ページ内で扱う入金レコード型。共有 PaymentRecord に表示用フィールドを追加。 */
type PayRecord = PaymentRecord & {
  order: string;
  customer: string;
  method: string;
  due: string;
  daysOverdue: number;
};

const fmt = (n: number) => `¥${n.toLocaleString()}`;

/** サンプルデータ。status / overpaid は paymentStatusOf から派生させる。 */
function makeRecord(
  id: string,
  order: string,
  customer: string,
  orderTotal: number,
  paidAmount: number,
  method: string,
  due: string,
  daysOverdue: number,
): PayRecord {
  return {
    id,
    orderId: order,
    order,
    customer,
    method,
    due,
    daysOverdue,
    orderTotal,
    paidAmount,
    status: paymentStatusOf(orderTotal, paidAmount),
    overpaid: paidAmount > orderTotal,
  };
}

const INITIAL_PAYMENTS: PayRecord[] = [
  makeRecord("P001", "ORD-2026-00849", "田中一郎",   154000,     0, "銀行振込",   "2026-04-30", 0),
  makeRecord("P002", "ORD-2026-00844", "中村あかり",   3200,     0, "銀行振込",   "2026-04-25", 3),
  makeRecord("P003", "ORD-2026-00838", "井上智",      28500, 25000, "銀行振込",   "2026-04-20", 8),
  makeRecord("P004", "ORD-2026-00835", "木下真由",    45000,     0, "請求書払い", "2026-05-31", 0),
  makeRecord("P005", "ORD-2026-00830", "山田太郎",    18200, 18200, "銀行振込",   "2026-04-08", 0),
  makeRecord("P006", "ORD-2026-00820", "佐藤花子",    12400, 12800, "クレカ",     "2026-04-15", 0),
];

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
  useEffect(() => {
    if (paymentStore.getState().length === 0) {
      paymentStore.setItems(INITIAL_PAYMENTS);
    }
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
  }, []);
  const storeItems = useSyncExternalStore(
    (cb) => paymentStore.subscribe(cb),
    () => paymentStore.getState(),
    () => INITIAL_PAYMENTS,
  );
  const payments = storeItems as ReadonlyArray<PayRecord>;

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [keyword, setKeyword] = useState("");
  const [methodFilter, setMethodFilter] = useState("すべて");

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

  // ---- 入金登録（paymentStore + 実 cascade） ----------------------------------
  /**
   * paymentStore.applyRecord で SM 遷移 + handler effects を一気に取得。
   * - effects.sendMail → mailQueue.enqueueAll
   * - effects.cascadeOrderAction (confirmPayment) → orderStore に流す。
   *   これにより受注が 入金待ち → 引当待ち に進み、allocateInventory が
   *   emit される。当該受注の allocation を inventoryStore.applyAllocate に流す。
   * - 引当失敗時は markInventoryShortage を自動連鎖。
   */
  function handleRecordPayment(id: string, amount: number): {
    enqueued: number;
    duplicateSkipped: number;
    disabledSkipped: number;
    cascadeApplied: number;
    allocated: number;
    shortageMarked: number;
    shipmentsCreated: number;
  } {
    const result = paymentStore.applyRecord(id, amount);
    const mailJobs: MailJob[] = [];
    let cascadeApplied = 0;
    let allocated = 0;
    let shortageMarked = 0;
    let shipmentsCreated = 0;

    if (!result.applied) {
      return {
        ...mailQueue.enqueueAll([], getAutoMailEnabled()),
        cascadeApplied,
        allocated,
        shortageMarked,
        shipmentsCreated,
      };
    }

    if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

    if (result.effects.cascadeOrderAction) {
      const orderRes = orderStore.applyTransition(
        result.effects.cascadeOrderAction.orderId,
        result.effects.cascadeOrderAction.action,
      );
      if (orderRes.applied) {
        cascadeApplied += 1;
        if (orderRes.effects.sendMail) mailJobs.push(orderRes.effects.sendMail);

        // 出荷指示の自動作成 cascade
        if (orderRes.effects.createShipment) {
          const sharedOrder = orderStore
            .getState()
            .find((o) => o.id === orderRes.effects.createShipment!.orderId);
          const created = shipmentStore.createForOrder(
            orderRes.effects.createShipment.orderId,
            {
              customer: sharedOrder?.customer as string | undefined,
              shop: sharedOrder?.shop as string | undefined,
              items: sharedOrder?.items as number | undefined,
              amount: sharedOrder?.amount as number | undefined,
            },
          );
          if (created.created) shipmentsCreated += 1;
        }

        // confirmPayment cascade で order が引当待ちに到達 → allocateInventory を流す
        if (orderRes.effects.allocateInventory) {
          const sharedOrder = orderStore
            .getState()
            .find((o) => o.id === orderRes.effects.allocateInventory!.orderId);
          const allocation = sharedOrder?.allocation as AllocationLine[] | undefined;
          if (allocation && allocation.length > 0) {
            const cascade = inventoryStore.applyAllocate(allocation);
            allocated += cascade.appliedCount;
            const failed = cascade.failedLines.length + cascade.unknownLines.length;
            if (failed > 0 && cascade.appliedCount === 0) {
              const shortageRes = orderStore.applyTransition(
                sharedOrder!.id,
                "markInventoryShortage",
              );
              if (shortageRes.applied) shortageMarked += 1;
            }
          }
        }
      }
    }

    return {
      ...mailQueue.enqueueAll(mailJobs, getAutoMailEnabled()),
      cascadeApplied,
      allocated,
      shortageMarked,
      shipmentsCreated,
    };
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

  // ---- 操作ボタン処理（モック） -----------------------------------------------
  function onClickRecord(p: PayRecord) {
    // モック: 残額を全額入金する
    const remaining = p.orderTotal - p.paidAmount;
    if (remaining <= 0) {
      toast.show(`${p.order} はすでに全額入金済みです`);
      return;
    }
    const result = handleRecordPayment(p.id, remaining);
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

    toast.show(
      `${p.order}: ${fmt(remaining)} を入金登録しました${cascadeLine}${mailLine}`,
      result.shortageMarked > 0 ? "info" : "success",
    );
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
            onClick={() => toast.show("CSV エクスポートを開始します（モック）")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
          >
            CSV出力
          </button>
        </div>
        <p className="text-xs text-gray-400">
          全 {payments.length} 件 / 表示 {filtered.length} 件
        </p>
      </div>
    </div>
  );
}
