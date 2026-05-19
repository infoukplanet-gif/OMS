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
  createShipmentForOrder,
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

export interface CreateForOrderResult {
  /** 既存 Shipment があった場合は false（重複作成しない冪等性保持） */
  created: boolean;
  record?: ShipmentRecord;
}

export interface CreateForOrderExtras {
  customer?: string;
  carrier?: string;
  shop?: string;
  shipDate?: string;
  amount?: number;
  items?: number;
  [extra: string]: unknown;
}

export interface ShipmentStore {
  getState(): readonly ShipmentRecord[];
  setItems(next: ReadonlyArray<ShipmentRecord>): void;
  applyTransition(
    shipmentId: string,
    action: ShipmentAction,
    options?: ApplyShipmentOptions,
  ): ApplyShipmentResult;
  /**
   * orderId に紐付く Shipment を新規作成（出荷指示作成 状態）。
   * id は SHP-YYYY-NNNNN 形式で自動採番（既存最大 + 1）。
   * 既に同じ orderId の Shipment がいれば created=false で no-op。
   */
  createForOrder(orderId: string, extras?: CreateForOrderExtras): CreateForOrderResult;
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

    createForOrder(orderId, extras = {}) {
      const dup = items.find((s) => s.orderIds.includes(orderId));
      if (dup !== undefined) {
        return { created: false, record: dup };
      }

      const year = new Date().getFullYear();
      const nums = items
        .map((s) => {
          const m = new RegExp(`^SHP-\\d{4}-(\\d{5})$`).exec(s.id);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const next = (nums.length === 0 ? 0 : Math.max(...nums)) + 1;
      const id = `SHP-${year}-${String(next).padStart(5, "0")}`;

      const smState = createShipmentForOrder(orderId);
      const record: ShipmentRecord = { ...extras, ...smState, id };
      items = [...items, record];
      notify();
      return { created: true, record };
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
