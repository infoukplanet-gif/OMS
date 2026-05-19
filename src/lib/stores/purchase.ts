/**
 * Purchase の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/purchase-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - purchase 状態機械 + handler effects のレールを画面横断で共有する薄いストア
 * - subscribe / getState は useSyncExternalStore で消費する想定
 * - applyIssue / applyReceive / applyCancel が state-machine プリミティブと
 *   onPurchaseTransitioned を一気通貫で実行し、cascade 用 effects を返す
 * - applyReceive の effects.receiveInventory は呼び出し元が inventoryStore.applyReceive に流す責務
 * - 通知は実遷移が発生した時のみ（no-op 時は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 */

import {
  cancel,
  issue,
  receivePurchaseOrder,
  type PurchaseOrderState,
  type ReceiptLine,
} from "../state-machines/purchase";
import {
  onPurchaseTransitioned,
  type PurchaseTransitionEffects,
} from "../events/purchase-handlers";

/**
 * ストアに乗せる purchase order の型。SM が触る (status/lines) に id +
 * UI 表示用の任意フィールド（supplier, amount, expected 等）を intersection で受ける。
 */
export type PurchaseOrderRecord = PurchaseOrderState & {
  id: string;
  [extra: string]: unknown;
};

export interface ApplyPurchaseResult {
  applied: boolean;
  before?: PurchaseOrderRecord;
  after?: PurchaseOrderRecord;
  effects: PurchaseTransitionEffects;
}

export interface PurchaseStore {
  getState(): readonly PurchaseOrderRecord[];
  setItems(next: ReadonlyArray<PurchaseOrderRecord>): void;
  applyIssue(orderId: string): ApplyPurchaseResult;
  applyReceive(orderId: string, receipts: ReadonlyArray<ReceiptLine>): ApplyPurchaseResult;
  applyCancel(orderId: string): ApplyPurchaseResult;
  subscribe(listener: () => void): () => void;
}

export function createPurchaseStore(
  initial: ReadonlyArray<PurchaseOrderRecord> = [],
): PurchaseStore {
  let items: readonly PurchaseOrderRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  /** プリミティブ呼び出しを共通化。new state が同一参照なら no-op として扱う。 */
  function applyPrimitive(
    orderId: string,
    primitive: (state: PurchaseOrderState) => PurchaseOrderState,
  ): ApplyPurchaseResult {
    const idx = items.findIndex((r) => r.id === orderId);
    if (idx === -1) return { applied: false, effects: {} };

    const before = items[idx];
    const stateBefore: PurchaseOrderState = {
      status: before.status,
      lines: before.lines,
    };
    const stateAfter = primitive(stateBefore);
    if (stateAfter === stateBefore) {
      return { applied: false, before, effects: {} };
    }

    const after: PurchaseOrderRecord = { ...before, ...stateAfter };
    const effects = onPurchaseTransitioned(stateBefore, stateAfter);
    items = [...items.slice(0, idx), after, ...items.slice(idx + 1)];
    notify();
    return { applied: true, before, after, effects };
  }

  return {
    getState() {
      return items;
    },

    setItems(next) {
      items = [...next];
      notify();
    },

    applyIssue(orderId) {
      return applyPrimitive(orderId, issue);
    },

    applyReceive(orderId, receipts) {
      return applyPrimitive(orderId, (state) => receivePurchaseOrder(state, [...receipts]));
    },

    applyCancel(orderId) {
      return applyPrimitive(orderId, cancel);
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
 * クライアントセッション内で共有される単一の PurchaseStore インスタンス。
 * purchasing/page から書き込み、products/inventory/page から間接的に
 * inventoryStore 経由で在庫が反映される。
 */
export const purchaseStore: PurchaseStore = createPurchaseStore();
