/**
 * 商品マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 仕様: docs/prd/events-integration-v1.md（商品マスタ更新→受注画面のサジェスト即反映）
 *
 * 商品マスタは OMS のあらゆる画面の起点になる。商品一覧/登録ページがここに書き、
 * 受注作成フォーム（OrderForm）の商品サジェストや在庫一覧の商品名表示がここを購読する。
 * code（商品コード = SKU 相当）が一意キー。
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 * テストは createProductStore() を直接使う（global singleton は test 用ではない）。
 */

/** 商品マスタの1件。 */
export interface ProductRecord {
  /** 商品コード（一意キー・SKU 相当）。 */
  code: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  status: "販売中" | "停止中" | "廃番";
  [extra: string]: unknown;
}

export interface UpsertResult {
  /** 新規追加なら true、既存更新なら false。 */
  created: boolean;
}

export interface ProductStore {
  getState(): readonly ProductRecord[];
  /** code で 1 件取得。無ければ undefined。 */
  findByCode(code: string): ProductRecord | undefined;
  /** code 一致なら上書き、無ければ追加。 */
  upsert(record: ProductRecord): UpsertResult;
  /** code 一致のレコードを削除。削除したら true、見つからなければ false。 */
  remove(code: string): boolean;
  /** 一覧全体を置換（初期同期用）。 */
  setItems(next: ReadonlyArray<ProductRecord>): void;
  subscribe(listener: () => void): () => void;
}

export function createProductStore(initial: ReadonlyArray<ProductRecord> = []): ProductStore {
  let items: readonly ProductRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    findByCode(code) {
      return items.find((p) => p.code === code);
    },

    upsert(record) {
      const idx = items.findIndex((p) => p.code === record.code);
      if (idx === -1) {
        items = [...items, record];
        notify();
        return { created: true };
      }
      items = [...items.slice(0, idx), { ...items[idx], ...record }, ...items.slice(idx + 1)];
      notify();
      return { created: false };
    },

    remove(code) {
      const idx = items.findIndex((p) => p.code === code);
      if (idx === -1) return false;
      items = [...items.slice(0, idx), ...items.slice(idx + 1)];
      notify();
      return true;
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
 * クライアントセッション内で共有される単一の ProductStore インスタンス。
 * /products 系画面と OrderForm の商品サジェストが同じインスタンスを購読する。
 */
export const productStore: ProductStore = createProductStore();
