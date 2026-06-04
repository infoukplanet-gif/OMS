/**
 * createMasterStore — マスタ系（顧客・卸先・仕入先・店舗・ユーザー・セット商品）の
 * 共有インメモリ・ストア工場。id をキーにした upsert / remove / findById を提供する。
 *
 * 取引系（受注・入金・発注・返品）は連鎖（cascade）を持つため専用ストアを使う。
 * こちらは「登録フォーム → 一覧に出る」という単純な CRUD を担うマスタ専用。
 *
 * クライアントセッション内でのみ生存（リロードで初期シードに戻る）。
 * 永続化は usePersistentStore + snapshotDomain/restoreDomain 側で別途行う。
 */

export interface MasterRecord {
  id: string;
  [extra: string]: unknown;
}

export interface UpsertResult {
  created: boolean;
}

export interface RemoveResult {
  removed: boolean;
}

export interface MasterStore<T extends MasterRecord> {
  getState(): readonly T[];
  findById(id: string): T | undefined;
  upsert(record: T): UpsertResult;
  remove(id: string): RemoveResult;
  setItems(next: ReadonlyArray<T>): void;
  subscribe(listener: () => void): () => void;
}

export function createMasterStore<T extends MasterRecord>(
  initial: ReadonlyArray<T> = [],
): MasterStore<T> {
  let items: readonly T[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    findById(id) {
      return items.find((item) => item.id === id);
    },

    upsert(record) {
      const index = items.findIndex((item) => item.id === record.id);
      if (index === -1) {
        items = [...items, record];
        notify();
        return { created: true };
      }
      const merged = { ...items[index], ...record };
      items = items.map((item, i) => (i === index ? merged : item));
      notify();
      return { created: false };
    },

    remove(id) {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return { removed: false };
      items = items.filter((item) => item.id !== id);
      notify();
      return { removed: true };
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
