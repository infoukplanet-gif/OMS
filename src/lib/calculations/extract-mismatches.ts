import type { MailJob } from "@/lib/mail/queue";

/** 金額不整合の種別。不足=回収不足、過剰=受け取り過ぎ。 */
export type MismatchKind = "不足" | "過剰";

/** 不整合判定に必要な入金レコードの最小形。 */
export interface MismatchPaymentInput {
  paymentId: string;
  orderId: string;
  customer: string;
  orderTotal: number;
  paidAmount: number;
  daysOverdue: number;
}

/** 金額不整合確認画面の1行。diff は paid - total（不足は負値）。 */
export interface MismatchRow {
  paymentId: string;
  orderId: string;
  customer: string;
  orderAmt: number;
  paidAmt: number;
  diff: number;
  kind: MismatchKind;
  daysOpen: number;
  reason: string;
}

const REASON_OVERPAID = "過剰入金（差額返金対象）";
const REASON_PARTIAL = "一部入金（残額未回収）";
const REASON_OVERDUE_UNPAID = "期日超過・未入金";

/**
 * 入金レコード一覧から金額不整合行を抽出する。
 *
 * 判定ルール:
 * - paidAmount > orderTotal → 過剰（差額返金対象）
 * - 0 < paidAmount < orderTotal → 不足（期日内でも残額未回収として対象）
 * - paidAmount <= 0 かつ期日超過 → 不足（期日超過・未入金）
 * - 期日内の未入金・ぴったり完済・orderTotal <= 0 の不正レコードは対象外
 */
export function extractMismatches(
  payments: readonly MismatchPaymentInput[],
): MismatchRow[] {
  const rows: MismatchRow[] = [];

  for (const p of payments) {
    if (p.orderTotal <= 0) continue;

    const diff = p.paidAmount - p.orderTotal;
    const daysOpen = Math.max(0, p.daysOverdue);

    let kind: MismatchKind;
    let reason: string;

    if (diff > 0) {
      kind = "過剰";
      reason = REASON_OVERPAID;
    } else if (p.paidAmount > 0 && diff < 0) {
      kind = "不足";
      reason = REASON_PARTIAL;
    } else if (p.paidAmount <= 0 && p.daysOverdue > 0) {
      kind = "不足";
      reason = REASON_OVERDUE_UNPAID;
    } else {
      continue; // 完済 or 期日内未入金は通常フロー
    }

    rows.push({
      paymentId: p.paymentId,
      orderId: p.orderId,
      customer: p.customer,
      orderAmt: p.orderTotal,
      paidAmt: p.paidAmount,
      diff,
      kind,
      daysOpen,
      reason,
    });
  }

  return rows;
}

/** 差額不足の再請求メールジョブを生成する（dedupeKey で受注×トリガー単位の重複抑止）。 */
export function rebillJobFor(orderId: string): MailJob {
  return {
    orderId,
    triggerType: "rebill-mismatch",
    dedupeKey: `${orderId}:rebill-mismatch`,
  };
}
