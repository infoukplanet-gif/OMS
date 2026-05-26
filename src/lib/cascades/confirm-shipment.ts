/**
 * 出荷確定 cascade（画面横断で共有する連鎖オーケストレーション）
 *
 * 仕様: docs/prd/shipment-state-machine.md / docs/prd/events-integration-v1.md
 *
 * shipments/page（出荷確定）から呼ばれる。shipmentStore.applyTransition(confirmShipment)
 * を起点に、受注の出荷登録（印刷済み→出荷済み）/ 在庫消費 / 出荷通知メールまでを適用する。
 *
 * - store 群は依存注入（fresh store でユニットテスト可能）
 * - 在庫消費は対応 Order の allocation を onHand+allocated 同時減算で確定する
 */

import type { AllocationLine } from "../state-machines/inventory";
import type { AutoMailEnabled, EnqueueResult, MailJob, MailQueue } from "../mail/queue";
import type { ShipmentStore } from "../stores/shipment";
import type { OrderStore } from "../stores/orders";
import type { InventoryStore } from "../stores/inventory";

export interface ConfirmShipmentDeps {
  shipmentStore: ShipmentStore;
  orderStore: OrderStore;
  inventoryStore: InventoryStore;
  mailQueue: MailQueue;
  autoMailEnabled: AutoMailEnabled;
}

export interface ConfirmShipmentCascadeResult extends EnqueueResult {
  /** confirmShipment 遷移が実際に適用されたか（出荷待ち以外・未存在は false）。 */
  applied: boolean;
  /** 受注の registerShipment 連鎖が適用された件数（0 or 1）。 */
  cascadeApplied: number;
  /** 受注連鎖が打てなかった件数（対応 order が無い／状態不一致）。 */
  cascadeSkipped: number;
  /** 在庫消費が適用された SKU 数。 */
  consumed: number;
  /** 在庫消費が SM ガードで失敗した明細数。 */
  consumeFailed: number;
}

/**
 * 出荷を確定し、受注の出荷登録・在庫消費・出荷通知メールまで連鎖適用する。
 *
 * @param shipmentId 出荷伝票ID
 * @param deps 連鎖対象の共有ストア群
 */
export function applyConfirmShipmentCascade(
  shipmentId: string,
  deps: ConfirmShipmentDeps,
): ConfirmShipmentCascadeResult {
  const { shipmentStore, orderStore, inventoryStore, mailQueue, autoMailEnabled } = deps;

  const tracking = shipmentStore.getState().find((s) => s.id === shipmentId)?.trackingNumber;
  const result = shipmentStore.applyTransition(shipmentId, "confirmShipment", {
    trackingNumber: tracking,
  });

  const mailJobs: MailJob[] = [];
  let cascadeApplied = 0;
  let cascadeSkipped = 0;
  let consumed = 0;
  let consumeFailed = 0;

  if (!result.applied) {
    return {
      applied: false,
      ...mailQueue.enqueueAll([], autoMailEnabled),
      cascadeApplied,
      cascadeSkipped,
      consumed,
      consumeFailed,
    };
  }

  if (result.effects.sendMail) mailJobs.push(result.effects.sendMail);

  // 受注の出荷登録（印刷済み → 出荷済み）
  if (result.effects.cascadeOrderAction) {
    const r = orderStore.applyTransition(
      result.effects.cascadeOrderAction.orderId,
      result.effects.cascadeOrderAction.action,
    );
    if (r.applied) cascadeApplied += 1;
    else cascadeSkipped += 1;
  }

  // 在庫消費: 対応 Order の allocation を onHand + allocated 同時減算で確定
  if (result.effects.consumeInventory) {
    const sharedOrder = orderStore
      .getState()
      .find((o) => o.id === result.effects.consumeInventory!.orderId);
    const allocation = sharedOrder?.allocation as AllocationLine[] | undefined;
    if (allocation && allocation.length > 0) {
      const cascade = inventoryStore.applyConsume(allocation);
      consumed += cascade.appliedCount;
      consumeFailed += cascade.failedLines.length;
    }
  }

  return {
    applied: true,
    ...mailQueue.enqueueAll(mailJobs, autoMailEnabled),
    cascadeApplied,
    cascadeSkipped,
    consumed,
    consumeFailed,
  };
}
