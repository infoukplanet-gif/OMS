/**
 * Order の状態遷移を観察し、副作用を「記述子として」返す pure function 群。
 *
 * 仕様: docs/prd/events-integration-v1.md
 *
 * - db や外部APIには触らない（記述子を返すだけ）
 * - 連鎖の制御（記述子の実行）は呼び出し元の責務
 * - v1 シナリオは1ホップで完結する
 */

import type { OrderState, OrderStatus } from "../state-machines/order";

export interface OrderTransitionEffects {
  /** Order が引当待ちに到達した時に Shipment を新規作成する記述子 */
  createShipment?: { orderId: string };
  /** Order が引当待ちに到達した時の在庫引当記述子 */
  allocateInventory?: { orderId: string; reason: "order-confirmed" };
  /** Order がキャンセルされた時の在庫戻し記述子 */
  releaseInventory?: { orderId: string; reason: "order-cancelled" };
  /** 自動メール送信記述子（PRD: mail-trigger-v1.md） */
  sendMail?: { orderId: string; triggerType: "thanks"; dedupeKey: string };
}

const NEW_ORDER_SOURCE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "新規受付",
  "確認待ち",
]);
const ORDER_CONFIRMED_TARGET_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "入金待ち",
  "引当待ち",
  "発売日時待ち",
]);

interface Options {
  /** true の時は Shipment 自動生成をスキップする（運用画面からの手動オーバーライド用） */
  disableShipmentAutoCreate?: boolean;
}

/**
 * 引当が完了している（キャンセル時に在庫戻しが必要な）状態セット。
 * 引当待ち以降は在庫が押さえられているので、キャンセル時に解放する必要がある。
 */
const ALLOCATED_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "引当待ち",
  "印刷待ち",
  "印刷済み",
]);

export function onOrderTransitioned(
  before: OrderState,
  after: OrderState,
  orderId: string,
  options: Options = {},
): OrderTransitionEffects {
  const effects: OrderTransitionEffects = {};

  // 引当待ち到達 → Shipment 自動生成 + 在庫引当
  if (before.status !== "引当待ち" && after.status === "引当待ち") {
    if (!options.disableShipmentAutoCreate) {
      effects.createShipment = { orderId };
    }
    effects.allocateInventory = { orderId, reason: "order-confirmed" };
  }

  // 引当済み状態からキャンセル → 在庫戻し記述子
  if (
    before.status !== "キャンセル" &&
    after.status === "キャンセル" &&
    ALLOCATED_STATUSES.has(before.status)
  ) {
    effects.releaseInventory = { orderId, reason: "order-cancelled" };
  }

  // 受注確定（新規受付/確認待ち → 入金待ち/引当待ち/発売日時待ち） → サンクスメール
  if (
    NEW_ORDER_SOURCE_STATUSES.has(before.status) &&
    ORDER_CONFIRMED_TARGET_STATUSES.has(after.status)
  ) {
    effects.sendMail = {
      orderId,
      triggerType: "thanks",
      dedupeKey: `${orderId}:thanks`,
    };
  }

  return effects;
}
