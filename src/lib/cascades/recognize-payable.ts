/**
 * 発注入荷 → 買掛金計上 cascade（純粋・DI）。
 *
 * 仕様: docs/prd/payable-recognition-v1.md
 *
 * 出荷確定 → 売上計上（confirm-shipment の salesStore.recognize）の買い側ミラー。
 * purchaseStore.applyReceive の before/after（受領数の差分）を金額按分し、
 * 今回入荷分の買掛金だけを payableStore に計上する。
 *
 * store は依存注入（fresh store でユニットテスト可能）。global singleton と
 * 計上日（Date）は glue 層 run-recognize-payable.ts に隔離する。
 */

import {
  totalOrdered,
  totalReceived,
  type PurchaseOrderState,
} from "../state-machines/purchase";
import { payableAccrualForReceipt } from "../calculations/payable-recognition";
import type { PayableStore } from "../stores/payable";

export interface RecognizePayableDeps {
  payableStore: PayableStore;
}

export interface RecognizePayableArgs {
  /** 発注 ID */
  poId: string;
  /** 仕入先名 */
  supplier: string;
  /** PO 総額 */
  poAmount: number;
  /** 入荷前の PO 状態（受領数の起点） */
  before: PurchaseOrderState;
  /** 入荷後の PO 状態（受領数の到達点） */
  after: PurchaseOrderState;
  /** 計上日（YYYY/MM/DD） */
  accruedAt: string;
}

export interface RecognizePayableCascadeResult {
  /** 今回計上した買掛金額（計上なし・冪等スキップは 0）。 */
  accrued: number;
  /** 台帳に新規計上されたか。 */
  applied: boolean;
}

/**
 * 入荷の受領差分を金額按分し、買掛金を 1 行計上する。
 * 受領が進んでいない／冪等スキップ時は `{ accrued: 0, applied: false }`。
 */
export function recognizePayableOnReceipt(
  deps: RecognizePayableDeps,
  args: RecognizePayableArgs,
): RecognizePayableCascadeResult {
  const totalOrderedQty = totalOrdered(args.after);
  const receivedBefore = totalReceived(args.before);
  const receivedAfter = totalReceived(args.after);

  const accrued = payableAccrualForReceipt({
    poAmount: args.poAmount,
    totalOrderedQty,
    receivedBefore,
    receivedAfter,
  });

  if (accrued <= 0) return { accrued: 0, applied: false };

  const result = deps.payableStore.recognize({
    poId: args.poId,
    supplier: args.supplier,
    amount: accrued,
    cumulativeReceived: receivedAfter,
    accruedAt: args.accruedAt,
  });

  return { accrued: result.applied ? accrued : 0, applied: result.applied };
}
