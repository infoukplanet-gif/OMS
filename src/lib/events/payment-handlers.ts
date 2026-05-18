/**
 * Payment の状態遷移を観察し、副作用を「記述子として」返す pure function 群。
 *
 * 仕様: docs/prd/payment-state-machine.md §6 / docs/prd/events-integration-v1.md
 *
 * - db や外部APIには触らない（記述子を返すだけ）
 * - 連鎖の制御（記述子の実行 = transitionOrder）は呼び出し元の責務
 * - v1 シナリオは1ホップで完結する
 */

import type { PaymentState } from "../state-machines/payment";
import type { OrderStatus } from "../state-machines/order";

export interface PaymentTransitionEffects {
  /**
   * Payment の遷移を受けて Order 側に叩く要求。
   *  - confirmPayment       : 入金済み到達時（受注: 入金待ち → 引当待ち）
   *  - revertToPaymentWait  : 入金済みから巻き戻った時（受注: 引当待ち → 入金待ち）
   */
  cascadeOrderAction?: {
    orderId: string;
    action: "confirmPayment" | "revertToPaymentWait";
  };
}

interface Options {
  /**
   * 巻き戻し判定に使う、現在の Order ステータス。
   * 引当待ち以外なら巻き戻さない（印刷待ち以降は物理的な印刷物・出荷指示を伴うため運用判断）。
   */
  orderStatus?: OrderStatus;
}

export function onPaymentTransitioned(
  before: PaymentState,
  after: PaymentState,
  orderId: string,
  options: Options = {},
): PaymentTransitionEffects {
  const effects: PaymentTransitionEffects = {};

  // 入金済み到達 → 受注を引当待ちへ進める
  if (before.status !== "入金済み" && after.status === "入金済み") {
    effects.cascadeOrderAction = { orderId, action: "confirmPayment" };
  }

  // 入金済みから巻き戻り → 受注がまだ引当待ちにいる時だけ入金待ちへ戻す
  if (
    before.status === "入金済み" &&
    after.status !== "入金済み" &&
    options.orderStatus === "引当待ち"
  ) {
    effects.cascadeOrderAction = { orderId, action: "revertToPaymentWait" };
  }

  return effects;
}
