/**
 * Inventory の共有ストア（クライアントセッション内シングルトン）
 *
 * 仕様: docs/prd/inventory-state-machine.md / docs/prd/purchase-state-machine.md
 *
 * - 発注の入荷確定（purchaseStore.applyReceipt → effects.receiveInventory）を
 *   InventoryRecord.onHand に反映するための薄いストア
 * - subscribe / getState は useSyncExternalStore で消費する想定
 * - applyReceive は AllocationLine[] を受け、(sku, warehouse) ごとに onHand を加算する
 * - 該当 record がない受領明細は unknownReceipts として返す（呼び出し元で警告表示できるように）
 * - subscribe 通知は実適用が発生した時のみ（no-op は通知しない）
 *
 * v1 はブラウザ module スコープでの保持（リロードで初期化）。v2 で server action + DB に置き換え。
 */

import {
  allocate,
  consume,
  receiveStock,
  release,
  type AllocationLine,
  type InventoryRecord,
} from "../state-machines/inventory";

export interface ApplyReceiveResult {
  applied: boolean;
  /** 実 onHand 加算が発生した record の件数 */
  appliedCount: number;
  /** どの inventory record にもマッチしなかった受領明細 */
  unknownReceipts: AllocationLine[];
}

export interface ApplyCascadeResult {
  applied: boolean;
  /** SM プリミティブが実際に適用された record の件数 */
  appliedCount: number;
  /** どの inventory record にもマッチしなかった明細 */
  unknownLines: AllocationLine[];
  /** record はあるが SM ガード（在庫不足・引当不足等）で適用できなかった明細 */
  failedLines: AllocationLine[];
}

export interface InventoryStore {
  getState(): readonly InventoryRecord[];
  setItems(next: ReadonlyArray<InventoryRecord>): void;
  applyReceive(receipts: ReadonlyArray<AllocationLine>): ApplyReceiveResult;
  applyAllocate(lines: ReadonlyArray<AllocationLine>): ApplyCascadeResult;
  applyRelease(lines: ReadonlyArray<AllocationLine>): ApplyCascadeResult;
  applyConsume(lines: ReadonlyArray<AllocationLine>): ApplyCascadeResult;
  subscribe(listener: () => void): () => void;
}

const keyOf = (sku: string, warehouse: string): string => `${sku} ${warehouse}`;

export function createInventoryStore(
  initial: ReadonlyArray<InventoryRecord> = [],
): InventoryStore {
  let items: readonly InventoryRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  /**
   * allocate / release / consume の共通カスケード処理。
   * - (sku, warehouse) ごとに qty を合算
   * - 各 record に SM プリミティブを適用
   * - 適用結果: unknownLines（record 未登録）/ failedLines（SM ガード拒否）/ appliedCount
   */
  function applyCascade(
    lines: ReadonlyArray<AllocationLine>,
    primitive: (record: InventoryRecord, qty: number) => InventoryRecord,
  ): ApplyCascadeResult {
    const aggregated = new Map<string, AllocationLine>();
    for (const l of lines) {
      if (l.qty <= 0) continue;
      const key = keyOf(l.sku, l.warehouse);
      const existing = aggregated.get(key);
      if (existing === undefined) {
        aggregated.set(key, { sku: l.sku, warehouse: l.warehouse, qty: l.qty });
      } else {
        aggregated.set(key, { ...existing, qty: existing.qty + l.qty });
      }
    }

    if (aggregated.size === 0) {
      return { applied: false, appliedCount: 0, unknownLines: [], failedLines: [] };
    }

    const matchedKeys = new Set<string>();
    const failedLines: AllocationLine[] = [];
    let appliedCount = 0;
    const nextItems = items.map((rec) => {
      const key = keyOf(rec.sku, rec.warehouse);
      const line = aggregated.get(key);
      if (line === undefined) return rec;
      matchedKeys.add(key);
      const updated = primitive(rec, line.qty);
      if (updated === rec) {
        // SM ガード拒否（在庫不足・引当不足など）
        failedLines.push(line);
        return rec;
      }
      appliedCount++;
      return updated;
    });

    const unknownLines: AllocationLine[] = [];
    for (const [key, line] of aggregated) {
      if (!matchedKeys.has(key)) unknownLines.push(line);
    }

    if (appliedCount === 0) {
      return { applied: false, appliedCount: 0, unknownLines, failedLines };
    }

    items = nextItems;
    notify();
    return { applied: true, appliedCount, unknownLines, failedLines };
  }

  return {
    getState() {
      return items;
    },

    setItems(next) {
      items = [...next];
      notify();
    },

    applyReceive(receipts) {
      // (sku, warehouse) ごとに qty を合算（qty <= 0 は除外）
      const aggregated = new Map<string, AllocationLine>();
      for (const r of receipts) {
        if (r.qty <= 0) continue;
        const key = keyOf(r.sku, r.warehouse);
        const existing = aggregated.get(key);
        if (existing === undefined) {
          aggregated.set(key, { sku: r.sku, warehouse: r.warehouse, qty: r.qty });
        } else {
          aggregated.set(key, { ...existing, qty: existing.qty + r.qty });
        }
      }

      if (aggregated.size === 0) {
        return { applied: false, appliedCount: 0, unknownReceipts: [] };
      }

      const matchedKeys = new Set<string>();
      let appliedCount = 0;
      const nextItems = items.map((rec) => {
        const key = keyOf(rec.sku, rec.warehouse);
        const r = aggregated.get(key);
        if (r === undefined) return rec;
        matchedKeys.add(key);
        const updated = receiveStock(rec, r.qty);
        if (updated === rec) return rec;
        appliedCount++;
        return updated;
      });

      const unknownReceipts: AllocationLine[] = [];
      for (const [key, r] of aggregated) {
        if (!matchedKeys.has(key)) unknownReceipts.push(r);
      }

      if (appliedCount === 0) {
        return { applied: false, appliedCount: 0, unknownReceipts };
      }

      items = nextItems;
      notify();
      return { applied: true, appliedCount, unknownReceipts };
    },

    applyAllocate(lines) {
      return applyCascade(lines, allocate);
    },

    applyRelease(lines) {
      return applyCascade(lines, release);
    },

    applyConsume(lines) {
      return applyCascade(lines, consume);
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
 * クライアントセッション内で共有される単一の InventoryStore インスタンス。
 * purchasing/page・products/inventory/page など複数ページから読み書きされる。
 */
export const inventoryStore: InventoryStore = createInventoryStore();
