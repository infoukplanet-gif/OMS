/**
 * 返品の状態遷移を観察し、副作用を「記述子として」返す pure function。
 *
 * 仕様: docs/prd/return-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - db や外部 API には触らない（記述子を返すだけ）
 * - 連鎖の実行（在庫戻し・返金起票）は呼び出し元（store / page）の責務
 * - 起点は「返品完了」到達のみ。それ以外の遷移では空の effects を返す。
 */

import type { ReturnState } from "../state-machines/return";
import type { AllocationLine } from "../state-machines/inventory";

export interface ReturnTransitionEffects {
  /** 良品判定された数量だけ在庫へ戻す記述子（restockQty>0 の line のみ）。 */
  restockInventory?: { lines: AllocationLine[] };
  /**
   * 返金記述子。返品完了時に payment ドメインへ起票する。
   * 実際の返金実行（手動確定）は payment 側 / 返品画面の操作に委ねる。
   */
  refundPayment?: { orderId: string; amount: number; reason: "return-completed" };
}

export function onReturnTransitioned(
  before: ReturnState,
  after: ReturnState,
): ReturnTransitionEffects {
  const effects: ReturnTransitionEffects = {};

  // 返品完了到達 → 良品の在庫戻し + 返金起票
  if (before.status !== "返品完了" && after.status === "返品完了") {
    const lines: AllocationLine[] = after.lines
      .filter((l) => l.restockQty > 0)
      .map((l) => ({ sku: l.sku, warehouse: l.warehouse, qty: l.restockQty }));

    if (lines.length > 0) {
      effects.restockInventory = { lines };
    }
    if (after.refundAmount > 0) {
      effects.refundPayment = {
        orderId: after.orderId,
        amount: after.refundAmount,
        reason: "return-completed",
      };
    }
  }

  return effects;
}
