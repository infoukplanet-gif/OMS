/**
 * Payment の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/payment-state-machine.md / docs/prd/events-integration-v1.md
 *
 * - payment 状態機械 + handler effects のレールを画面横断で共有する薄いストア
 * - PaymentRecord は (status, orderTotal, paidAmount, overpaid) に id + orderId +
 *   表示用フィールドを intersection で受ける（orderId は cascade で必須）
 * - applyRecord(id, amount) / applyCancel(id, amount, options?) が
 *   recordPayment / cancelPayment + onPaymentTransitioned を一気通貫で実行し、
 *   cascadeOrderAction (confirmPayment / revertToPaymentWait) と
 *   sendMail (payment-confirmed) effects を呼び出し元に返す
 * - 通知は実遷移が発生した時のみ（no-op は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 */

import {
  cancelPayment,
  recordPayment,
  type PaymentState,
} from "../state-machines/payment";
import type { OrderStatus } from "../state-machines/order";
import {
  onPaymentTransitioned,
  type PaymentTransitionEffects,
} from "../events/payment-handlers";

/**
 * ストアに乗せる payment の型。SM が触る (status/orderTotal/paidAmount/overpaid) に
 * id (payment 伝票ID) + orderId (cascade 用) + UI 表示用の任意フィールドを intersection で受ける。
 */
export type PaymentRecord = PaymentState & {
  id: string;
  orderId: string;
  [extra: string]: unknown;
};

export interface ApplyCancelOptions {
  /** 巻き戻し判定に使う、対応する Order の現在ステータス */
  orderStatus?: OrderStatus;
}

export interface ApplyPaymentResult {
  applied: boolean;
  before?: PaymentRecord;
  after?: PaymentRecord;
  effects: PaymentTransitionEffects;
}

export interface PaymentStore {
  getState(): readonly PaymentRecord[];
  setItems(next: ReadonlyArray<PaymentRecord>): void;
  applyRecord(paymentId: string, amount: number): ApplyPaymentResult;
  applyCancel(
    paymentId: string,
    amount: number,
    options?: ApplyCancelOptions,
  ): ApplyPaymentResult;
  subscribe(listener: () => void): () => void;
}

export function createPaymentStore(
  initial: ReadonlyArray<PaymentRecord> = [],
): PaymentStore {
  let items: readonly PaymentRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  /**
   * recordPayment / cancelPayment の共通カスケード処理。
   * - id で record を検索（無ければ applied=false）
   * - SM プリミティブを適用、参照同一なら no-op として返す
   * - onPaymentTransitioned で effects 取得
   */
  function applyPrimitive(
    paymentId: string,
    primitive: (state: PaymentState) => PaymentState,
    handlerOptions: { orderStatus?: OrderStatus } = {},
  ): ApplyPaymentResult {
    const idx = items.findIndex((p) => p.id === paymentId);
    if (idx === -1) return { applied: false, effects: {} };

    const before = items[idx];
    const stateBefore: PaymentState = {
      status: before.status,
      orderTotal: before.orderTotal,
      paidAmount: before.paidAmount,
      overpaid: before.overpaid,
    };
    const stateAfter = primitive(stateBefore);
    if (stateAfter === stateBefore) {
      return { applied: false, before, effects: {} };
    }

    const after: PaymentRecord = { ...before, ...stateAfter };
    const effects = onPaymentTransitioned(
      stateBefore,
      stateAfter,
      before.orderId,
      handlerOptions,
    );

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

    applyRecord(paymentId, amount) {
      return applyPrimitive(paymentId, (s) => recordPayment(s, amount));
    },

    applyCancel(paymentId, amount, options = {}) {
      return applyPrimitive(
        paymentId,
        (s) => cancelPayment(s, amount),
        { orderStatus: options.orderStatus },
      );
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
 * クライアントセッション内で共有される単一の PaymentStore インスタンス。
 * payments/page を中心に、入金確定/取消時の cascade を統一して扱う。
 */
export const paymentStore: PaymentStore = createPaymentStore();
