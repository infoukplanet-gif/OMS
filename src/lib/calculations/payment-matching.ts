/**
 * 入金消込（一括マッチング）
 *
 * 仕様: docs/prd/payment-state-machine.md §1（v1 スコープ外として言及）
 *
 * 銀行 CSV 等から得た入金明細（ReceiptEntry: orderId + 金額）と現在の Payment 状態を
 * 突き合わせ、`recordPayment` を順次適用した結果を返す pure function。
 *
 * - 入力 Map・Payment 値は変更しない
 * - 同一 orderId に対する複数 receipt は順次累積する（after は累積後の状態）
 * - orderId が見つからない / 金額が非正の receipt は unmatched にまとめる
 * - 実際の状態反映（DB 更新）は呼び出し元の責務。本関数は plan を返すだけ
 */

import { recordPayment, type PaymentState } from "../state-machines/payment";

export interface ReceiptEntry {
  /** 受注番号（銀行振込明細の摘要・問い合わせ番号等から抽出） */
  orderId: string;
  /** 入金額（正の値） */
  amount: number;
  /** 入金日時（任意・監査用） */
  receivedAt?: string;
  /** 取り込み元（任意・監査用。例: 'mitsui-bank-csv'） */
  source?: string;
}

export interface PaymentMatch {
  orderId: string;
  amount: number;
  /** マッチ適用前の Payment 状態（同一 orderId の前回マッチ結果を反映） */
  before: PaymentState;
  /** recordPayment 適用後の Payment 状態 */
  after: PaymentState;
}

export type UnmatchedReason = "order-not-found" | "non-positive-amount";

export interface UnmatchedReceipt {
  orderId: string;
  amount: number;
  reason: UnmatchedReason;
}

export interface PaymentMatchingResult {
  matches: PaymentMatch[];
  unmatched: UnmatchedReceipt[];
}

export function matchPayments(
  receipts: ReceiptEntry[],
  payments: ReadonlyMap<string, PaymentState>,
): PaymentMatchingResult {
  const matches: PaymentMatch[] = [];
  const unmatched: UnmatchedReceipt[] = [];

  // working copy: 累積マッチを反映していくが入力 Map は触らない
  const working = new Map<string, PaymentState>();

  for (const r of receipts) {
    if (r.amount <= 0) {
      unmatched.push({ orderId: r.orderId, amount: r.amount, reason: "non-positive-amount" });
      continue;
    }

    const current = working.get(r.orderId) ?? payments.get(r.orderId);
    if (current === undefined) {
      unmatched.push({ orderId: r.orderId, amount: r.amount, reason: "order-not-found" });
      continue;
    }

    const next = recordPayment(current, r.amount);
    working.set(r.orderId, next);
    matches.push({ orderId: r.orderId, amount: r.amount, before: current, after: next });
  }

  return { matches, unmatched };
}
