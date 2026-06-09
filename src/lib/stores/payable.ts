/**
 * 買掛金（仕入債務）台帳の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/payable-recognition-v1.md（発注入荷 → 買掛金計上 → 仕入支払）
 *
 * 出荷確定 → 売上計上（salesStore）の買い側ミラー。
 * 発注入荷 cascade（runRecognizePayableOnReceipt）が入荷の都度 recognize() を呼び、
 * PO 総額を数量按分した買掛金を 1 行ずつ積む。支払は手動の recordPayment() のみ。
 *
 * - subscribe / getState / getPayments は useSyncExternalStore で消費する想定
 *   （purchasing/invoices が購読）
 * - (poId, cumulativeReceived) を冪等キーにし、同一入荷の二重計上を防ぐ
 *   （入荷ダイアログ再送・cascade 再実行に耐える）
 * - 通知は実際に行が積まれた時のみ（重複 recognize は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 * テストは createPayableStore() を直接使う（global singleton は test 用ではない）。
 */

import type { PayableAccrual, PayablePayment } from "../calculations/payable-recognition";

export interface RecognizePayableResult {
  /** 新規に台帳へ積まれたか。 */
  applied: boolean;
  /** 同一 (poId, cumulativeReceived) が既存で no-op になったか。 */
  duplicate: boolean;
}

export interface PayableStore {
  /** 買掛金計上台帳。 */
  getState(): readonly PayableAccrual[];
  /** 仕入支払台帳。 */
  getPayments(): readonly PayablePayment[];
  /** 入荷ベースで買掛金を計上する。同一 (poId, cumulativeReceived) は二重計上しない。 */
  recognize(entry: PayableAccrual): RecognizePayableResult;
  /** 手動の仕入支払を記録する。 */
  recordPayment(payment: PayablePayment): void;
  /** 計上台帳全体を置換する（初期同期用）。 */
  setItems(next: ReadonlyArray<PayableAccrual>): void;
  /** 支払台帳全体を置換する（初期同期用）。 */
  setPayments(next: ReadonlyArray<PayablePayment>): void;
  subscribe(listener: () => void): () => void;
}

export function createPayableStore(
  initialAccruals: ReadonlyArray<PayableAccrual> = [],
  initialPayments: ReadonlyArray<PayablePayment> = [],
): PayableStore {
  let accruals: readonly PayableAccrual[] = [...initialAccruals];
  let payments: readonly PayablePayment[] = [...initialPayments];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return accruals;
    },

    getPayments() {
      return payments;
    },

    recognize(entry) {
      if (
        accruals.some(
          (e) => e.poId === entry.poId && e.cumulativeReceived === entry.cumulativeReceived,
        )
      ) {
        return { applied: false, duplicate: true };
      }
      accruals = [...accruals, entry];
      notify();
      return { applied: true, duplicate: false };
    },

    recordPayment(payment) {
      payments = [...payments, payment];
      notify();
    },

    setItems(next) {
      accruals = [...next];
      notify();
    },

    setPayments(next) {
      payments = [...next];
      notify();
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
 * クライアントセッション内で共有される単一の PayableStore インスタンス。
 * purchasing/page・purchasing/receiving（入荷で計上）と
 * purchasing/invoices（買掛金の表示・手動支払）から読み書きされる。
 */
export const payableStore: PayableStore = createPayableStore();
