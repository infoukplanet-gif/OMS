/**
 * キー重複を弾く追記型台帳ストアの汎用ファクトリ（クライアントセッション内）。
 *
 * sales.ts / mail queue と同じ「dedupe-by-key で冪等に積む」パターンを共通化したもの。
 * 出荷確定の追加副作用（モール出荷通知 / 倉庫FTP配信 / 出荷確定監査ログ）のように、
 * shipmentId を冪等キーにして「同一出荷の再確定でも二重生成しない」台帳を量産するために使う。
 *
 * - subscribe / getState は useSyncExternalStore で消費する想定
 * - 実際に行が積まれた時のみ通知（重複追記は通知しない）
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置換。
 */

export interface KeyedLedgerResult {
  /** 新規に台帳へ積まれたか。 */
  applied: boolean;
  /** 同一キーが既存で no-op になったか。 */
  duplicate: boolean;
}

export interface KeyedLedgerStore<T> {
  getState(): readonly T[];
  /** キーが未登録なら追記する。既存キーは二重生成しない（元の行を保持）。 */
  add(entry: T): KeyedLedgerResult;
  /** 台帳全体を置換する（初期同期 / restore 用）。 */
  setItems(next: ReadonlyArray<T>): void;
  subscribe(listener: () => void): () => void;
}

/**
 * @param keyOf 各レコードの冪等キーを取り出す関数
 * @param initial 初期データ
 */
export function createKeyedLedgerStore<T>(
  keyOf: (entry: T) => string,
  initial: ReadonlyArray<T> = [],
): KeyedLedgerStore<T> {
  let items: readonly T[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    add(entry) {
      const key = keyOf(entry);
      if (items.some((e) => keyOf(e) === key)) {
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
