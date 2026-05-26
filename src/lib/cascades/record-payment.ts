/**
 * 入金記録 cascade（画面横断で共有する連鎖オーケストレーション）
 *
 * 仕様: docs/prd/events-integration-v1.md
 *
 * payments/page（単発入金）と payments/bulk（一括消込）の両方から呼ばれる。
 * paymentStore.applyRecord → handler effects を起点に、受注確定 / 出荷指示作成 /
 * 在庫引当 / 在庫不足マーク / メール enqueue までを一気通貫で適用する。
 *
 * - store 群は引数で注入する（singleton 直参照ではなく依存注入）。
 *   これにより fresh store を渡してユニットテストできる。
 * - 連鎖の途中失敗（引当不可）は止めずに markInventoryShortage で記録する。
 */

import type { AllocationLine } from "../state-machines/inventory";
import type {
  AutoMailEnabled,
  EnqueueResult,
  MailJob,
  MailQueue,
} from "../mail/queue";
import type { PaymentStore } from "../stores/payment";
import type { OrderStore } from "../stores/orders";
import type { ShipmentStore } from "../stores/shipment";
import type { InventoryStore } from "../stores/inventory";
import { planOrderAllocation } from "../allocation/plan";
import { getAllocationRules, type AllocationRules } from "../allocation/rules";

export interface RecordPaymentDeps {
  paymentStore: PaymentStore;
  orderStore: OrderStore;
  shipmentStore: ShipmentStore;
  inventoryStore: InventoryStore;
  mailQueue: MailQueue;
  autoMailEnabled: AutoMailEnabled;
  /** 引当ルール（倉庫優先順 / 分割可否）。未指定はグローバル設定を使う。 */
  rules?: AllocationRules;
}

export interface RecordPaymentCascadeResult extends EnqueueResult {
  /** payment SM 遷移が実際に適用されたか（amount<=0 / 二重完済 / 未存在は false）。 */
  applied: boolean;
  /** 受注確定（confirmPayment）が適用された件数（0 or 1）。 */
  cascadeApplied: number;
  /** 在庫引当が成功した SKU 数。 */
  allocated: number;
  /** 引当不可で在庫不足マークした受注件数（0 or 1）。 */
  shortageMarked: number;
  /** 自動生成された出荷指示の件数（0 or 1）。 */
  shipmentsCreated: number;
}

/**
 * 入金を記録し、完済なら受注確定〜出荷生成〜在庫引当まで連鎖適用する。
 *
 * @param paymentId 入金伝票ID
 * @param amount 入金額（<=0 は no-op）
 * @param deps 連鎖対象の共有ストア群
 */
export function applyRecordPaymentCascade(
  paymentId: string,
  amount: number,
  deps: RecordPaymentDeps,
): RecordPaymentCascadeResult {
  const {
    paymentStore,
    orderStore,
    shipmentStore,
    inventoryStore,
    mailQueue,
    autoMailEnabled,
  } = deps;
  const rules = deps.rules ?? getAllocationRules();

  const result = paymentStore.applyRecord(paymentId, amount);
  const mailJobs: MailJob[] = [];
  let cascadeApplied = 0;
  let allocated = 0;
  let shortageMarked = 0;
  let shipmentsCreated = 0;

  if (!result.applied) {
    return {
      applied: false,
      ...mailQueue.enqueueAll([], autoMailEnabled),
      cascadeApplied,
      allocated,
      shortageMarked,
      shipmentsCreated,
    };
  }

  if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

  if (result.effects.cascadeOrderAction) {
    const orderRes = orderStore.applyTransition(
      result.effects.cascadeOrderAction.orderId,
      result.effects.cascadeOrderAction.action,
    );
    if (orderRes.applied) {
      cascadeApplied += 1;
      if (orderRes.effects.sendMail) mailJobs.push(orderRes.effects.sendMail);

      // 出荷指示の自動作成 cascade
      if (orderRes.effects.createShipment) {
        const sharedOrder = orderStore
          .getState()
          .find((o) => o.id === orderRes.effects.createShipment!.orderId);
        const created = shipmentStore.createForOrder(
          orderRes.effects.createShipment.orderId,
          {
            customer: sharedOrder?.customer as string | undefined,
            shop: sharedOrder?.shop as string | undefined,
            items: sharedOrder?.items as number | undefined,
            amount: sharedOrder?.amount as number | undefined,
          },
        );
        if (created.created) shipmentsCreated += 1;
      }

      // confirmPayment cascade で order が引当待ちに到達 → ルール適用で在庫引当
      if (orderRes.effects.allocateInventory) {
        const sharedOrder = orderStore
          .getState()
          .find((o) => o.id === orderRes.effects.allocateInventory!.orderId);
        const demand = sharedOrder?.allocation as AllocationLine[] | undefined;
        if (sharedOrder && demand && demand.length > 0) {
          const plan = planOrderAllocation(sharedOrder.id, demand, inventoryStore.getState(), rules);
          if (plan.ok) {
            const cascade = inventoryStore.applyAllocate(plan.allocation.lines);
            allocated += cascade.appliedCount;
            // 確定した倉庫別ラインを order に書き戻す（出荷確定の在庫消費・取消の解放で同一ラインを使う）
            orderStore.patch(sharedOrder.id, { allocation: plan.allocation.lines });
          } else {
            const shortageRes = orderStore.applyTransition(sharedOrder.id, "markInventoryShortage");
            if (shortageRes.applied) shortageMarked += 1;
          }
        }
      }
    }
  }

  return {
    applied: true,
    ...mailQueue.enqueueAll(mailJobs, autoMailEnabled),
    cascadeApplied,
    allocated,
    shortageMarked,
    shipmentsCreated,
  };
}
