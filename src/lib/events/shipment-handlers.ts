/**
 * Shipment の状態遷移を観察し、副作用を「記述子として」返す pure function 群。
 *
 * 仕様: docs/prd/events-integration-v1.md
 *
 * - db や外部APIには触らない（記述子を返すだけ）
 * - 連鎖の制御（記述子の実行）は呼び出し元の責務
 * - v1 シナリオは1ホップで完結する
 */

import type { ShipmentState } from "../state-machines/shipment";
import type { OrderStatus } from "../state-machines/order";

export interface ShipmentTransitionEffects {
  /** Shipment の遷移を Order に波及させる記述子 */
  cascadeOrderAction?: { orderId: string; action: "registerShipment" | "cancel" };
  /** Shipment 確定時の在庫消費記述子（onHand と allocated を同時に減らす） */
  consumeInventory?: { orderId: string; reason: "shipment-confirmed" };
  /** Shipment キャンセル時の在庫戻し記述子 */
  releaseInventory?: { orderId: string; reason: "shipment-cancelled" };
  /** 自動メール送信記述子（PRD: mail-trigger-v1.md） */
  sendMail?: { orderId: string; triggerType: "ship-notify"; dedupeKey: string };
}

interface Options {
  /**
   * Shipment がキャンセルされた時の Order 側の現在ステータス。
   * これが「印刷済み未満（出荷済み・キャンセル以外）」なら Order に cancel を波及させる。
   * 出荷済み・キャンセル の場合は波及不要（呼び出し元から省略可）。
   */
  orderStatusAtCancel?: OrderStatus;
}

/**
 * Order に cancel 連鎖を流すべきかどうか。
 * Order が既に出荷済みやキャンセルに到達している場合は不要（cancel ガードに引っかかるため）。
 */
function shouldCascadeCancelToOrder(orderStatusAtCancel: OrderStatus | undefined): boolean {
  if (orderStatusAtCancel === undefined) return false;
  return orderStatusAtCancel !== "出荷済み" && orderStatusAtCancel !== "キャンセル";
}

export function onShipmentTransitioned(
  before: ShipmentState,
  after: ShipmentState,
  options: Options = {},
): ShipmentTransitionEffects {
  const effects: ShipmentTransitionEffects = {};

  // 出荷済み到達 → Order に registerShipment を波及 + 在庫消費 + 出荷完了通知メール
  if (before.status !== "出荷済み" && after.status === "出荷済み") {
    // v1 は orderIds.length === 1 を想定（PRD §2）。先頭1件で連鎖を組む。
    const orderId = after.orderIds[0];
    if (orderId !== undefined) {
      effects.cascadeOrderAction = { orderId, action: "registerShipment" };
      effects.consumeInventory = { orderId, reason: "shipment-confirmed" };
      effects.sendMail = {
        orderId,
        triggerType: "ship-notify",
        dedupeKey: `${orderId}:ship-notify`,
      };
    }
  }

  // キャンセル到達 → Order 連鎖（条件付き）と在庫戻し（常時）
  if (before.status !== "キャンセル" && after.status === "キャンセル") {
    const orderId = after.orderIds[0];

    if (orderId !== undefined && shouldCascadeCancelToOrder(options.orderStatusAtCancel)) {
      effects.cascadeOrderAction = { orderId, action: "cancel" };
    }

    if (orderId !== undefined) {
      effects.releaseInventory = { orderId, reason: "shipment-cancelled" };
    }
  }

  return effects;
}
