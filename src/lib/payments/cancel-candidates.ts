/**
 * 入金期日超過のキャンセル候補抽出（pure function）。
 *
 * 仕様: docs/prd/events-integration-v1.md（入金未確認7日 → 最終催告 → キャンセル候補リスト）
 *
 * 最終催告（payment-final-call-7d）と同じ「期日7日超過」を既定閾値に、未完済の入金を
 * キャンセル候補として抽出する。実際のキャンセル実行は applyCancelOrderCascade の責務で、
 * ここは「どの受注がキャンセル候補か」を計算するだけ（表示と実行の分離）。
 *
 * v2 でスケジューラ層を server action + cron 化する際も、この純関数はそのまま再利用できる。
 */

/** 期日超過判定の入力（入金伝票の最小サブセット）。 */
export interface OverdueAccount {
  paymentId: string;
  orderId: string;
  customer: string;
  /** "YYYY-MM-DD" 形式の入金期日 */
  due: string;
  paidAmount: number;
  orderTotal: number;
}

/** キャンセル候補 1 件。 */
export interface CancelCandidate {
  paymentId: string;
  orderId: string;
  customer: string;
  /** 期日からの超過日数。 */
  daysOverdue: number;
  /** 未回収残額（orderTotal - paidAmount）。 */
  outstanding: number;
}

/** 最終催告と揃えた既定の超過日数閾値。 */
const DEFAULT_THRESHOLD_DAYS = 7;

/** YYYY-MM-DD の差分日数。due > today なら負値。 */
function daysOverdue(dueISO: string, today: Date): number {
  const due = new Date(`${dueISO}T00:00:00Z`).getTime();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((now - due) / (24 * 60 * 60 * 1000));
}

/**
 * 期日超過かつ未完済の入金をキャンセル候補として抽出する。超過日数の降順でソート。
 *
 * @param accounts 入金伝票群
 * @param today 判定基準日
 * @param thresholdDays 候補に挙げる超過日数の下限（既定 7）
 */
export function extractCancelCandidates(
  accounts: ReadonlyArray<OverdueAccount>,
  today: Date,
  thresholdDays: number = DEFAULT_THRESHOLD_DAYS,
): CancelCandidate[] {
  const candidates: CancelCandidate[] = [];
  for (const a of accounts) {
    if (a.paidAmount >= a.orderTotal) continue; // 完済は対象外
    const overdue = daysOverdue(a.due, today);
    if (overdue < thresholdDays) continue;
    candidates.push({
      paymentId: a.paymentId,
      orderId: a.orderId,
      customer: a.customer,
      daysOverdue: overdue,
      outstanding: a.orderTotal - a.paidAmount,
    });
  }
  return candidates.sort((x, y) => y.daysOverdue - x.daysOverdue);
}
