/**
 * 確定売上台帳の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/events-integration-v1.md（出荷確定 → 売上計上）
 *
 * OMS の業務フロー 受注→引当→出荷→入金 の最終段「売上計上」を担う。
 * 出荷確定 cascade（applyConfirmShipmentCascade）が出荷確定時に recognize() を呼び、
 * 出荷ベースで確定した売上を 1 行ずつ積む。
 *
 * - subscribe / getState は useSyncExternalStore で消費する想定（analytics/sales が購読）
 * - shipmentId を冪等キーにし、同一出荷の二重計上を防ぐ（出荷確定 cascade の再実行に耐える）
 * - 通知は実際に行が積まれた時のみ（重複 recognize は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 * テストは createSalesStore() を直接使う（global singleton は test 用ではない）。
 */

/** 出荷確定で確定した売上 1 件。shipmentId が冪等キー。 */
export interface SalesEntry {
  /** 計上元の出荷伝票 ID（冪等キー） */
  shipmentId: string;
  /** 計上元の受注 ID */
  orderId: string;
  /** 受注の店舗 */
  shop: string;
  /** 受注の顧客名 */
  customer: string;
  /** 確定売上額（受注金額） */
  amount: number;
  /** 売上計上日（YYYY/MM/DD） */
  recognizedAt: string;
}

export interface RecognizeResult {
  /** 新規に台帳へ積まれたか。 */
  applied: boolean;
  /** 同一 shipmentId が既存で no-op になったか。 */
  duplicate: boolean;
}

export interface SalesStore {
  getState(): readonly SalesEntry[];
  /** 出荷ベースで売上を計上する。同一 shipmentId は二重計上しない。 */
  recognize(entry: SalesEntry): RecognizeResult;
  /** 台帳全体を置換する（初期同期用）。 */
  setItems(next: ReadonlyArray<SalesEntry>): void;
  subscribe(listener: () => void): () => void;
}

export function createSalesStore(initial: ReadonlyArray<SalesEntry> = []): SalesStore {
  let items: readonly SalesEntry[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    recognize(entry) {
      if (items.some((e) => e.shipmentId === entry.shipmentId)) {
        return { applied: false, duplicate: true };
      }
      items = [...items, entry];
      notify();
      return { applied: true, duplicate: false };
    },

    setItems(next) {
      items = [...next];
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
 * クライアントセッション内で共有される単一の SalesStore インスタンス。
 * shipments/page（出荷確定で計上）と analytics/sales（確定売上の表示）から読み書きされる。
 */
export const salesStore: SalesStore = createSalesStore();
