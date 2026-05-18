/**
 * Order の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/order-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - state-machine + handler effects のレールを画面横断で共有するための薄いストア
 * - subscribe / getState は useSyncExternalStore で消費する想定
 * - applyTransition が transitionOrder + onOrderTransitioned を一気通貫で実行し、
 *   effects（sendMail / createShipment / releaseInventory）を呼び出し元に返す
 * - effects の実行（mailQueue.enqueue や shared inventory store 反映）は呼び出し元の責務
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 * テストは createOrderStore() を直接使う（global singleton は test 用ではない）。
 */

import {
  transitionOrder,
  type OrderAction,
  type OrderState,
} from "../state-machines/order";
import {
  onOrderTransitioned,
  type OrderTransitionEffects,
} from "../events/order-handlers";

/**
 * ストアに乗せる order の型。SM が触る OrderState (status/inventoryShortage/releaseAt) に
 * id + UI 表示用の任意フィールドを足した形。各ページが拡張プロパティを持てるように intersection で組む。
 */
export type OrderRecord = OrderState & {
  id: string;
  // 各ページの表示用フィールドは Record で受ける（型はページ側で as 補完）
  [extra: string]: unknown;
};

export interface ApplyTransitionResult {
  applied: boolean;
  before?: OrderRecord;
  after?: OrderRecord;
  effects: OrderTransitionEffects;
}

export interface OrderStore {
  getState(): readonly OrderRecord[];
  setItems(next: ReadonlyArray<OrderRecord>): void;
  applyTransition(orderId: string, action: OrderAction): ApplyTransitionResult;
  subscribe(listener: () => void): () => void;
}

export function createOrderStore(initial: ReadonlyArray<OrderRecord> = []): OrderStore {
  let items: readonly OrderRecord[] = [...initial];
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

    applyTransition(orderId, action) {
      const idx = items.findIndex((o) => o.id === orderId);
      if (idx === -1) {
        return { applied: false, effects: {} };
      }
      const before = items[idx];
      const stateBefore: OrderState = {
        status: before.status,
        inventoryShortage: before.inventoryShortage,
        releaseAt: before.releaseAt,
      };
      const stateAfter = transitionOrder(stateBefore, action);
      if (stateAfter === stateBefore) {
        return { applied: false, before, effects: {} };
      }

      const after: OrderRecord = { ...before, ...stateAfter };
      const effects = onOrderTransitioned(stateBefore, stateAfter, orderId);

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
 * クライアントセッション内で共有される単一の OrderStore インスタンス。
 * orders/page・shipments/page・payments/page など複数ページから読み書きされる。
 */
export const orderStore: OrderStore = createOrderStore();
