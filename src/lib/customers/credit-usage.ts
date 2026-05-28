/**
 * 卸先（B2B）の与信使用額（受注由来分）の計算（pure function）。
 *
 * 仕様: docs/prd/events-integration-v1.md（顧客マスタ与信限度更新 → 既存受注の与信再チェック）
 *
 * 卸先マスタの creditLimit / creditUsed は legacy seed の固定値だが、新規 B2B 受注が立った時点で
 * その分を上乗せして「現在の与信使用額」とする。本関数は orderStore + paymentStore から
 * 「該当卸先に紐付く受注の未回収残額（orderTotal - paidAmount）」を合算して返す。
 *
 * 集計対象:
 *   - 受注の customerCode === 引数 customerCode（B2C 個人受注は customerCode 未設定で除外）
 *   - 受注ステータスが「キャンセル」ではない
 *   - 入金が未完済（paidAmount < orderTotal）
 *
 * 過剰入金は未回収扱いにしない（max(0, total-paid)）。完済はゼロ。
 */

import type { OrderStatus } from "../state-machines/order";

/** 与信集計に必要な受注の最小情報。 */
export interface CreditOrder {
  id: string;
  /** 紐付く卸先コード。B2C 個人受注は undefined。 */
  customerCode?: string;
  /** 受注金額（請求総額）。 */
  amount: number;
  status: OrderStatus;
}

/** 与信集計に必要な入金の最小情報。 */
export interface CreditPayment {
  orderId: string;
  orderTotal: number;
  paidAmount: number;
}

/**
 * 指定卸先の受注由来の未回収残額（与信使用額）を合算して返す。
 *
 * @param customerCode 卸先コード（例: "WS-001"）
 * @param orders すべての受注
 * @param payments すべての入金
 */
export function computeOrderCreditOutstanding(
  customerCode: string,
  orders: ReadonlyArray<CreditOrder>,
  payments: ReadonlyArray<CreditPayment>,
): number {
  const paymentByOrder = new Map<string, CreditPayment>();
  for (const p of payments) paymentByOrder.set(p.orderId, p);

  let total = 0;
  for (const order of orders) {
    if (order.customerCode !== customerCode) continue;
    if (order.status === "キャンセル") continue;
    const pay = paymentByOrder.get(order.id);
    const orderTotal = pay?.orderTotal ?? order.amount;
    const paidAmount = pay?.paidAmount ?? 0;
    const outstanding = orderTotal - paidAmount;
    if (outstanding > 0) total += outstanding;
  }
  return total;
}
