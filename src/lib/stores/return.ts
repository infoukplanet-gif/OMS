/**
 * 顧客返品の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/return-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - return 状態機械 + handler effects のレールを画面横断で共有する薄いストア
 * - applyTransition が transitionReturn + onReturnTransitioned を一気通貫で実行し、
 *   cascade 用 effects (restockInventory / refundPayment) を呼び出し元に返す
 * - 返金は「返品完了で自動起票・手動確定」方針。起票は refundStatus="起票済"、
 *   オペレーターが入金処理を確定したら markRefundConfirmed で "確定済" に更新する
 * - 通知は実遷移／実変更が発生した時のみ（no-op は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 */

import {
  transitionReturn,
  type InspectedGoodQty,
  type ReturnAction,
  type ReturnLine,
  type ReturnState,
} from "../state-machines/return";
import {
  onReturnTransitioned,
  type ReturnTransitionEffects,
} from "../events/return-handlers";

/** 返金の手動確定ステータス（UI 表示用、SM 外）。 */
export type RefundStatus = "未起票" | "起票済" | "確定済";

/**
 * ストアに乗せる返品の型。SM が触る (status, orderId, lines, refundAmount) に
 * id (RMA 番号) + UI 表示用の任意フィールド（customer, reason, requestedAt 等）を intersection で受ける。
 */
export type ReturnRecord = ReturnState & {
  id: string;
  /** 返金の手動確定ステータス。返品完了で "起票済"、入金確定で "確定済"。 */
  refundStatus?: RefundStatus;
  [extra: string]: unknown;
};

export interface ApplyReturnOptions {
  /** completeInspection 時の良品判定数量（sku+warehouse 単位）。 */
  inspectedGoodQty?: ReadonlyArray<InspectedGoodQty>;
}

export interface ApplyReturnResult {
  applied: boolean;
  before?: ReturnRecord;
  after?: ReturnRecord;
  effects: ReturnTransitionEffects;
}

export interface CreateForOrderExtras {
  lines: ReturnLine[];
  refundAmount: number;
  customer?: string;
  [extra: string]: unknown;
}

export interface CreateForOrderResult {
  created: boolean;
  record?: ReturnRecord;
}

export interface ReturnStore {
  getState(): readonly ReturnRecord[];
  setItems(next: ReadonlyArray<ReturnRecord>): void;
  applyTransition(
    returnId: string,
    action: ReturnAction,
    options?: ApplyReturnOptions,
  ): ApplyReturnResult;
  /** 返金を手動確定済みにする。既に確定済み or 未存在なら false。 */
  markRefundConfirmed(returnId: string): boolean;
  /** orderId に紐付く返品を新規作成（返品依頼 状態）。id は RMA-YYYY-NNNNN で自動採番。 */
  createForOrder(orderId: string, extras: CreateForOrderExtras): CreateForOrderResult;
  subscribe(listener: () => void): () => void;
}

export function createReturnStore(
  initial: ReadonlyArray<ReturnRecord> = [],
): ReturnStore {
  let items: readonly ReturnRecord[] = [...initial];
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

    applyTransition(returnId, action, options = {}) {
      const idx = items.findIndex((r) => r.id === returnId);
      if (idx === -1) return { applied: false, effects: {} };

      const before = items[idx];
      const stateBefore: ReturnState = {
        status: before.status,
        orderId: before.orderId,
        lines: before.lines,
        refundAmount: before.refundAmount,
      };
      const stateAfter = transitionReturn(stateBefore, action, {
        inspectedGoodQty: options.inspectedGoodQty,
      });
      if (stateAfter === stateBefore) {
        return { applied: false, before, effects: {} };
      }

      const effects = onReturnTransitioned(stateBefore, stateAfter);
      // 返金起票（effects.refundPayment あり）なら refundStatus を起票済に。
      const refundStatus: RefundStatus | undefined = effects.refundPayment
        ? "起票済"
        : before.refundStatus;
      const after: ReturnRecord = { ...before, ...stateAfter, refundStatus };

      items = [...items.slice(0, idx), after, ...items.slice(idx + 1)];
      notify();
      return { applied: true, before, after, effects };
    },

    markRefundConfirmed(returnId) {
      const idx = items.findIndex((r) => r.id === returnId);
      if (idx === -1) return false;
      const before = items[idx];
      if (before.refundStatus === "確定済") return false;

      const after: ReturnRecord = { ...before, refundStatus: "確定済" };
      items = [...items.slice(0, idx), after, ...items.slice(idx + 1)];
      notify();
      return true;
    },

    createForOrder(orderId, extras) {
      const year = new Date().getFullYear();
      const nums = items
        .map((r) => {
          const m = new RegExp(`^RMA-\\d{4}-(\\d{5})$`).exec(r.id);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);
      const next = (nums.length === 0 ? 0 : Math.max(...nums)) + 1;
      const id = `RMA-${year}-${String(next).padStart(5, "0")}`;

      const { lines, refundAmount, ...rest } = extras;
      const record: ReturnRecord = {
        ...rest,
        id,
        status: "返品依頼",
        orderId,
        lines,
        refundAmount,
        refundStatus: "未起票",
      };
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
 * クライアントセッション内で共有される単一の ReturnStore インスタンス。
 * returns/page を中心に、返品確定時の在庫戻し・返金起票の cascade を統一して扱う。
 */
export const returnStore: ReturnStore = createReturnStore();
