/**
 * 日次整合チェック
 *
 * 仕様: 各PRD（order/shipment/inventory/payment/purchase）の「失敗時のロールバック」セクションで
 * 「次フェーズの integrity-checks で日次検出」と明記されたドリフトを pure function で抽出する。
 *
 * 検査関数:
 *   - checkPaymentDrift           : Payment.status が paidAmount から導かれる値と一致するか
 *   - checkInventoryOverallocation: allocated > onHand の物理的不整合を検出
 *   - checkPurchaseDrift          : 入荷フェーズ（発行済/注残あり/仕入完了）の status が
 *                                    receivedQty から導かれる値と一致するか
 *   - checkOrderPaymentConsistency: 引当待ち以降の Order に対応する Payment が「入金済み」か
 *
 * すべて pure function。副作用なし。日次バッチや管理画面からの「整合監査」ボタンで呼ぶ想定。
 */

import { paymentStatusOf, type PaymentState } from "../state-machines/payment";
import type { InventoryRecord } from "../state-machines/inventory";
import {
  isFullyReceived,
  type PurchaseOrderState,
  type PurchaseOrderStatus,
} from "../state-machines/purchase";
import type { OrderState, OrderStatus } from "../state-machines/order";

export interface IntegrityIssue {
  severity: "error" | "warning";
  kind: string;
  entity: { domain: "order" | "payment" | "inventory" | "purchase"; id: string };
  detail: string;
}

/**
 * Payment の整合チェック。
 *  - payment-status-drift  : 保存 status と paymentStatusOf(orderTotal, paidAmount) の不一致
 *  - payment-overpaid-drift: overpaid フラグと (paidAmount > orderTotal) の不一致
 */
export function checkPaymentDrift(
  payments: ReadonlyMap<string, PaymentState>,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const [id, p] of payments) {
    const expectedStatus = paymentStatusOf(p.orderTotal, p.paidAmount);
    if (p.status !== expectedStatus) {
      issues.push({
        severity: "error",
        kind: "payment-status-drift",
        entity: { domain: "payment", id },
        detail: `stored ${p.status} but derived ${expectedStatus} (paidAmount=${p.paidAmount}, orderTotal=${p.orderTotal})`,
      });
    }
    const expectedOverpaid = p.paidAmount > p.orderTotal;
    if (p.overpaid !== expectedOverpaid) {
      issues.push({
        severity: "error",
        kind: "payment-overpaid-drift",
        entity: { domain: "payment", id },
        detail: `stored overpaid=${p.overpaid} but derived ${expectedOverpaid} (paidAmount=${p.paidAmount}, orderTotal=${p.orderTotal})`,
      });
    }
  }
  return issues;
}

/**
 * Inventory の整合チェック。
 *  - inventory-overallocated: allocated > onHand（物理的に存在しない引当）を検出。
 *    状態機械の allocate() は guard で防ぐが、onHand 直接補正で発生しうる。
 */
export function checkInventoryOverallocation(
  records: readonly InventoryRecord[],
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const r of records) {
    if (r.allocated > r.onHand) {
      issues.push({
        severity: "error",
        kind: "inventory-overallocated",
        entity: { domain: "inventory", id: `${r.sku}@${r.warehouse}` },
        detail: `allocated=${r.allocated} exceeds onHand=${r.onHand}`,
      });
    }
  }
  return issues;
}

/** 入荷フェーズ（status が receivedQty から派生する）のステータスセット。 */
const RECEIVING_STATUSES: ReadonlySet<PurchaseOrderStatus> = new Set<PurchaseOrderStatus>([
  "発行済",
  "注残あり",
  "仕入完了",
]);

/**
 * Purchase の整合チェック。
 *  - purchase-status-drift: 入荷フェーズの status が lines.receivedQty から派生する値と不一致
 *    （条件未達成 / 未発行 / キャンセル は明示的状態なので検査対象外）
 */
export function checkPurchaseDrift(
  purchases: ReadonlyMap<string, PurchaseOrderState>,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const [id, po] of purchases) {
    if (!RECEIVING_STATUSES.has(po.status)) continue;
    const derived = derivedReceivingStatus(po);
    if (po.status !== derived) {
      issues.push({
        severity: "error",
        kind: "purchase-status-drift",
        entity: { domain: "purchase", id },
        detail: `stored ${po.status} but derived ${derived} (lines receivedQty differ from status)`,
      });
    }
  }
  return issues;
}

function derivedReceivingStatus(po: PurchaseOrderState): PurchaseOrderStatus {
  if (isFullyReceived(po)) return "仕入完了";
  if (po.lines.some((l) => l.receivedQty > 0)) return "注残あり";
  return "発行済";
}

/**
 * 「引当待ち以降」と判定する Order ステータス集合。
 * これらの Order に対応する Payment は「入金済み」でなければならない。
 * 出荷済み・キャンセルは検査対象外（出荷済みは既に通過済み、キャンセルは支払い不要）。
 */
const POST_PAYMENT_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "引当待ち",
  "印刷待ち",
  "印刷済み",
]);

/**
 * Order-Payment の整合チェック。
 *  - order-payment-mismatch: 引当待ち以降の Order に対応する Payment が「入金済み」でない
 *  - order-payment-missing : 引当待ち以降の Order に対応する Payment が存在しない
 *  - 出荷済み・キャンセルは対象外
 */
export function checkOrderPaymentConsistency(
  orders: ReadonlyMap<string, OrderState>,
  payments: ReadonlyMap<string, PaymentState>,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const [id, o] of orders) {
    if (!POST_PAYMENT_ORDER_STATUSES.has(o.status)) continue;
    const p = payments.get(id);
    if (p === undefined) {
      issues.push({
        severity: "error",
        kind: "order-payment-missing",
        entity: { domain: "order", id },
        detail: `order is ${o.status} but no payment record exists`,
      });
      continue;
    }
    if (p.status !== "入金済み") {
      issues.push({
        severity: "error",
        kind: "order-payment-mismatch",
        entity: { domain: "order", id },
        detail: `order is ${o.status} but payment is ${p.status} (paidAmount=${p.paidAmount}, orderTotal=${p.orderTotal})`,
      });
    }
  }
  return issues;
}

export interface IntegritySnapshot {
  payments: ReadonlyMap<string, PaymentState>;
  inventory: readonly InventoryRecord[];
  purchases: ReadonlyMap<string, PurchaseOrderState>;
  orders: ReadonlyMap<string, OrderState>;
}

/**
 * 全ドメインの整合チェックを実行し、検出されたすべての IntegrityIssue を1配列で返す。
 * 日次バッチや「整合監査」ボタンから呼ぶ。
 */
export function runAllChecks(snapshot: IntegritySnapshot): IntegrityIssue[] {
  return [
    ...checkPaymentDrift(snapshot.payments),
    ...checkInventoryOverallocation(snapshot.inventory),
    ...checkPurchaseDrift(snapshot.purchases),
    ...checkOrderPaymentConsistency(snapshot.orders, snapshot.payments),
  ];
}
