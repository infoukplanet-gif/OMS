/**
 * 入金催促メールの定期トリガー（pure scheduler）。
 *
 * 仕様: docs/prd/mail-trigger-v1.md（拡張: payment-reminder v1）
 *
 * 期日超過の入金（status !== 入金済み）について、超過日数に応じて
 * 「催促メール（payment-reminder-3d）」「最終催告（payment-final-call-7d）」を
 * MailJob として生成する pure function。実 enqueue は呼び出し元の責務（mailQueue.enqueueAll）。
 *
 * 判定:
 *   - 7+日 → payment-final-call-7d
 *   - 3-6日 → payment-reminder-3d
 *   - 0-2日 → なし
 *   - 完済 (paidAmount >= orderTotal) → なし
 *
 * dedupeKey は `${orderId}:${triggerType}` 固定で、同セッション中の重複送信を抑止する。
 * v2 でスケジューラ層を server action + cron に置き換える際は、dedupeKey に日付を含めて
 * 日次の再送を許可する方針に変える。
 */

import type { MailJob } from "./queue";

export interface OverduePayment {
  paymentId: string;
  orderId: string;
  /** "YYYY-MM-DD" 形式の期日 */
  due: string;
  paidAmount: number;
  orderTotal: number;
}

/** YYYY-MM-DD の差分日数。due > today なら負値。 */
function daysOverdue(dueISO: string, today: Date): number {
  const due = new Date(`${dueISO}T00:00:00Z`).getTime();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((now - due) / (24 * 60 * 60 * 1000));
}

export function scheduleOverdueReminders(
  payments: ReadonlyArray<OverduePayment>,
  today: Date,
): MailJob[] {
  const jobs: MailJob[] = [];
  for (const p of payments) {
    if (p.paidAmount >= p.orderTotal) continue;
    const overdue = daysOverdue(p.due, today);
    if (overdue >= 7) {
      jobs.push({
        orderId: p.orderId,
        triggerType: "payment-final-call-7d",
        dedupeKey: `${p.orderId}:payment-final-call-7d`,
      });
    } else if (overdue >= 3) {
      jobs.push({
        orderId: p.orderId,
        triggerType: "payment-reminder-3d",
        dedupeKey: `${p.orderId}:payment-reminder-3d`,
      });
    }
  }
  return jobs;
}
