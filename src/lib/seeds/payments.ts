/**
 * paymentStore の初期シード値。
 *
 * payments/page（入金管理）と orders/page（受注一覧の返金 cascade）の両方から import される。
 * どちらの画面が先にマウントされても同じ入金伝票が共有されるよう、
 * ページローカルではなくここに集約する（orders / purchase-orders シードと同じ方針）。
 *
 * orderId は INITIAL_ORDERS と一致させること（cascade 連動のため必須）。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import { paymentStatusOf, type PaymentState } from "@/lib/state-machines/payment";
import type { PaymentRecord } from "@/lib/stores/payment";

/** 入金管理画面で扱う入金レコード型。共有 PaymentRecord に表示用フィールドを追加。 */
export type SeededPayment = PaymentRecord & {
  order: string;
  customer: string;
  method: string;
  due: string;
  daysOverdue: number;
};

/** サンプルデータ生成。status / overpaid は paymentStatusOf から派生させる。 */
function makeRecord(
  id: string,
  order: string,
  customer: string,
  orderTotal: number,
  paidAmount: number,
  method: string,
  due: string,
  daysOverdue: number,
): SeededPayment {
  const state: PaymentState = {
    status: paymentStatusOf(orderTotal, paidAmount),
    orderTotal,
    paidAmount,
    overpaid: paidAmount > orderTotal,
  };
  return { id, orderId: order, order, customer, method, due, daysOverdue, ...state };
}

// INITIAL_ORDERS の「入金待ち / 確認待ち」のうち代表的なものに対して
// 未入金 / 一部入金 / 完済 / 過剰入金 の各種 PaymentState を作る。
export const INITIAL_PAYMENTS: SeededPayment[] = [
  // 入金待ち（未入金）— ここから入金確認すると全 cascade が走る
  makeRecord("P001", "ORD-2026-08843", "小林 修",    67500,     0, "銀行振込",   "2026-04-30", 0),
  // 確認待ち（未入金、期日超過 3 日 → 催促メール対象）
  makeRecord("P002", "ORD-2026-08849", "田中 一郎",  154000,    0, "請求書払い", "2026-04-25", 3),
  // 一部入金（期日超過 8 日 → 最終催告対象）
  makeRecord("P003", "ORD-2026-08841", "吉田 あゆみ", 56800, 30000, "銀行振込",   "2026-04-20", 8),
  // 未入金（期日先）
  makeRecord("P004", "ORD-2026-08851", "山田 太郎",  32400,     0, "クレジットカード", "2026-05-31", 0),
  // 完済済み
  makeRecord("P005", "ORD-2026-08845", "伊藤 大輔",  18600, 18600, "クレジットカード", "2026-04-08", 0),
  // 過剰入金（請求 12400 / 入金 12800）
  makeRecord("P006", "ORD-2026-08842", "加藤 裕子",  12400, 12800, "代金引換",   "2026-04-15", 0),
];
