/**
 * 入金ドメイン状態機械
 *
 * 仕様: docs/prd/payment-state-machine.md
 *
 * 受注ごとの入金状況を PaymentState として表現し、recordPayment / cancelPayment の
 * プリミティブ操作で累計入金額を更新する。ステータス（未入金 / 一部入金 / 入金済み）は
 * 累計入金額と受注金額の照合から派生させ、判定式を1箇所に固定する。
 * 全操作はイミュータブル更新かつ冪等（guard 違反時は no-op で参照同一）。
 */

export type PaymentStatus = "未入金" | "一部入金" | "入金済み";

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "未入金",
  "一部入金",
  "入金済み",
] as const;

export interface PaymentState {
  /** 派生ステータス。recordPayment / cancelPayment が paidAmount から再計算する。 */
  status: PaymentStatus;
  /** 受注金額（照合対象。状態機械はこの値を変更しない）。 */
  orderTotal: number;
  /** 累計入金額。 */
  paidAmount: number;
  /** 受注金額を超過しているか（paidAmount > orderTotal）。「入金済み」時のみ true になりうる。 */
  overpaid: boolean;
}

/**
 * 受注金額と累計入金額から入金ステータスを導出する。
 *
 * 判定ルール（上から先勝ち）:
 *   1. 未入金   — paidAmount <= 0
 *   2. 入金済み — paidAmount >= orderTotal
 *   3. 一部入金 — それ以外
 */
export function paymentStatusOf(orderTotal: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return "未入金";
  if (paidAmount >= orderTotal) return "入金済み";
  return "一部入金";
}

/** paidAmount から status / overpaid を再計算した PaymentState を返す（内部ヘルパ）。 */
function reconcile(state: PaymentState, paidAmount: number): PaymentState {
  return {
    ...state,
    paidAmount,
    status: paymentStatusOf(state.orderTotal, paidAmount),
    overpaid: paidAmount > state.orderTotal,
  };
}

/**
 * 入金を登録する。累計入金額に amount を加算し、status / overpaid を再計算する。
 * amount <= 0 の場合は no-op（参照同一性保持）。
 *
 * 「同じ amount を二重登録」のようなアプリ側の誤りは guard では検知できない。
 * 入金伝票ID の重複チェックは呼び出し元の責務。
 */
export function recordPayment(state: PaymentState, amount: number): PaymentState {
  if (amount <= 0) return state;
  return reconcile(state, state.paidAmount + amount);
}

/**
 * 入金を取り消す（返金・誤入金訂正）。累計入金額から amount を減算し、
 * status / overpaid を再計算する。
 * amount <= 0 または amount > paidAmount の場合は no-op（参照同一性保持）。
 *
 * amount === paidAmount のとき全取消 → paidAmount = 0 → 未入金。
 * 二重取消しても残額超過 guard が効いて safe。
 */
export function cancelPayment(state: PaymentState, amount: number): PaymentState {
  if (amount <= 0) return state;
  if (amount > state.paidAmount) return state;
  return reconcile(state, state.paidAmount - amount);
}

/**
 * UI 表示用のバッジクラス。`src/app/payments/page.tsx` 等で再利用する。
 * Liquid Glass 規約に従いグラデーション禁止、色は単色 tint のみ。
 */
export const paymentStatusBadge: Record<PaymentStatus, string> = {
  未入金: "bg-red-500/15 text-red-700",
  一部入金: "bg-amber-500/15 text-amber-700",
  入金済み: "bg-emerald-500/15 text-emerald-700",
};
