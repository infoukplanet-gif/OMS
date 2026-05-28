/**
 * 受注キャンセル cascade（画面横断で共有する連鎖オーケストレーション）
 *
 * 仕様: docs/prd/order-state-machine.md / docs/prd/events-integration-v1.md
 *
 * orders/page（一括キャンセル）と payments/page（キャンセル候補リストからの個別キャンセル）から
 * 共有して呼ばれる。orderStore.applyTransition(cancel) を起点に、引当解放 / 入金返金 /
 * キャンセル通知メールまでを一気通貫で適用する。
 *
 * - store 群は依存注入（fresh store でユニットテスト可能）
 * - 在庫解放は引当済み状態（引当待ち/印刷待ち/印刷済み）からのみ（releaseInventory effect 有無で判定）
 * - 返金は入金済み分（paidAmount > 0）のみ全額返金。未入金は no-op
 */

import type { AllocationLine } from "../state-machines/inventory";
import type { AutoMailEnabled, EnqueueResult, MailJob, MailQueue } from "../mail/queue";
import type { OrderStore } from "../stores/orders";
import type { PaymentStore } from "../stores/payment";
import type { InventoryStore } from "../stores/inventory";

export interface CancelOrderDeps {
  orderStore: OrderStore;
  paymentStore: PaymentStore;
  inventoryStore: InventoryStore;
  mailQueue: MailQueue;
  autoMailEnabled: AutoMailEnabled;
}

export interface CancelOrderCascadeResult extends EnqueueResult {
  /** cancel 遷移が実際に適用されたか（出荷済み以降・未存在は false）。 */
  applied: boolean;
  /** 引当解放した在庫明細数。 */
  released: number;
  /** 入金済み分の返金が発生したか。 */
  refunded: boolean;
  /** 返金額（未入金は 0）。 */
  refundedAmount: number;
}

/**
 * 受注をキャンセルし、引当解放・入金返金・キャンセル通知メールまで連鎖適用する。
 *
 * @param orderId 受注ID
 * @param deps 連鎖対象の共有ストア群
 */
export function applyCancelOrderCascade(
  orderId: string,
  deps: CancelOrderDeps,
): CancelOrderCascadeResult {
  const { orderStore, paymentStore, inventoryStore, mailQueue, autoMailEnabled } = deps;

  const before = orderStore.getState().find((o) => o.id === orderId);
  const result = orderStore.applyTransition(orderId, "cancel");

  const mailJobs: MailJob[] = [];
  let released = 0;
  let refunded = false;
  let refundedAmount = 0;

  if (!result.applied) {
    return {
      applied: false,
      ...mailQueue.enqueueAll([], autoMailEnabled),
      released,
      refunded,
      refundedAmount,
    };
  }

  if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

  // 在庫解放: 引当済み状態からのキャンセルのみ（releaseInventory effect が立つ）
  if (result.effects.releaseInventory) {
    const allocation = before?.allocation as AllocationLine[] | undefined;
    if (allocation && allocation.length > 0) {
      const cascade = inventoryStore.applyRelease(allocation);
      released += cascade.appliedCount;
    }
  }

  // 返金: 入金済み分（paidAmount > 0）を全額返金。未入金は no-op
  if (result.effects.refundPayment) {
    const pay = paymentStore.getState().find((p) => p.orderId === orderId);
    if (pay && pay.paidAmount > 0) {
      const refundRes = paymentStore.applyCancel(pay.id, pay.paidAmount, {
        orderStatus: "キャンセル",
      });
      if (refundRes.applied) {
        refunded = true;
        refundedAmount += pay.paidAmount;
      }
    }
  }

  return {
    applied: true,
    ...mailQueue.enqueueAll(mailJobs, autoMailEnabled),
    released,
    refunded,
    refundedAmount,
  };
}
