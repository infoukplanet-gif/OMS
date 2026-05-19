/**
 * Shipment の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/shipment-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - shipment 状態機械 + handler effects のレールを画面横断で共有する薄いストア
 * - subscribe / getState は useSyncExternalStore で消費する想定
 * - applyTransition が transitionShipment + onShipmentTransitioned を一気通貫で実行し、
 *   cascade 用 effects (cascadeOrderAction / consumeInventory / releaseInventory / sendMail)
 *   を呼び出し元（page or future server action）に返す
 * - 通知は実遷移が発生した時のみ（no-op は通知しない）
 * - orderStatusAtCancel と trackingNumber は applyTransition のオプションで受け渡し
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 */

import {
  transitionShipment,
  type ShipmentAction,
  type ShipmentState,
} from "../state-machines/shipment";
import type { OrderStatus } from "../state-machines/order";
import {
  onShipmentTransitioned,
  type ShipmentTransitionEffects,
} from "../events/shipment-handlers";

/**
 * ストアに乗せる shipment の型。SM が触る (status, orderIds, trackingNumber) に
 * id + UI 表示用の任意フィールド（customer, carrier, shipDate 等）を intersection で受ける。
 */
export type ShipmentRecord = ShipmentState & {
  id: string;
  [extra: string]: unknown;
};

export interface ApplyShipmentOptions {
  /** confirmShipment で記録する伝票番号 */
  trackingNumber?: string;
  /** cancel 時の Order 側ステータス（cascadeOrderAction の判定に使う） */
  orderStatusAtCancel?: OrderStatus;
}

export interface ApplyShipmentResult {
  applied: boolean;
  before?: ShipmentRecord;
  after?: ShipmentRecord;
  effects: ShipmentTransitionEffects;
}

export interface ShipmentStore {
  getState(): readonly ShipmentRecord[];
  setItems(next: ReadonlyArray<ShipmentRecord>): void;
  applyTransition(
    shipmentId: string,
    action: ShipmentAction,
    options?: ApplyShipmentOptions,
  ): ApplyShipmentResult;
  subscribe(listener: () => void): () => void;
}

export function createShipmentStore(
  initial: ReadonlyArray<ShipmentRecord> = [],
): ShipmentStore {
  let items: readonly ShipmentRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    setItems(next) {
      items = [...next];
      notify();
    },

    applyTransition(shipmentId, action, options = {}) {
      const idx = items.findIndex((s) => s.id === shipmentId);
      if (idx === -1) return { applied: false, effects: {} };

      const before = items[idx];
      const stateBefore: ShipmentState = {
        status: before.status,
        orderIds: before.orderIds,
        trackingNumber: before.trackingNumber,
      };
      const stateAfter = transitionShipment(stateBefore, action, {
        trackingNumber: options.trackingNumber,
      });
      if (stateAfter === stateBefore) {
        return { applied: false, before, effects: {} };
      }

      const after: ShipmentRecord = { ...before, ...stateAfter };
      const effects = onShipmentTransitioned(stateBefore, stateAfter, {
        orderStatusAtCancel: options.orderStatusAtCancel,
      });

      items = [...items.slice(0, idx), after, ...items.slice(idx + 1)];
      notify();
      return { applied: true, before, after, effects };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * クライアントセッション内で共有される単一の ShipmentStore インスタンス。
 * shipments/page を中心に、出荷確定/キャンセル時の cascade を統一して扱う。
 */
export const shipmentStore: ShipmentStore = createShipmentStore();
