/**
 * 在庫ドメイン状態機械
 *
 * 仕様: docs/prd/inventory-state-machine.md
 *
 * SKU × 倉庫 ごとの InventoryRecord に対するプリミティブ操作（allocate / release / consume）と
 * 派生関数（freeStock / inventoryHealth）を集約する。複数 SKU 横断の引当ロジックは
 * 次フェーズの calculations/allocation.ts で扱う。
 */

export interface InventoryRecord {
  sku: string;
  warehouse: string;
  /** 物理在庫数（倉庫に存在する数） */
  onHand: number;
  /** 受注により引当済みの数 */
  allocated: number;
  /** 適正在庫数（運用パラメータ） */
  constant: number;
  /** 発注点（運用パラメータ） */
  reorder: number;
  /** 発注ロット数（運用パラメータ） */
  lot: number;
}

export type InventoryHealth = "適正" | "発注対象" | "在庫切れ" | "過剰";

export interface AllocationLine {
  sku: string;
  warehouse: string;
  qty: number;
}

/**
 * 受注の引当明細。受注ID と「どの倉庫の何 SKU を何個引き当てたか」のマッピング。
 * events/inventory-handlers が記述子（releaseInventory）を具体的な解放操作に変換するときに参照する。
 */
export interface OrderAllocation {
  orderId: string;
  lines: AllocationLine[];
}

/**
 * 引当できる残量。`onHand - allocated` の派生値。
 * 過引当時は負値を返して診断できるようにする（state machine が補正しない）。
 */
export function freeStock(record: InventoryRecord): number {
  return record.onHand - record.allocated;
}

/**
 * 在庫ヘルスステータスの派生関数。判定式を1箇所に固定するため UI 層から呼ばせる。
 *
 * 優先順位（上から先勝ち）:
 *   1. 在庫切れ — onHand <= 0 かつ free <= 0
 *   2. 発注対象 — free <= reorder
 *   3. 過剰 — onHand >= constant * 3
 *   4. 適正 — それ以外
 */
export function inventoryHealth(record: InventoryRecord): InventoryHealth {
  const free = freeStock(record);
  if (record.onHand <= 0 && free <= 0) return "在庫切れ";
  if (free <= record.reorder) return "発注対象";
  if (record.onHand >= record.constant * 3) return "過剰";
  return "適正";
}

/**
 * 引当を増やす。free stock が不足するか qty <= 0 の場合は no-op（参照同一性保持）。
 */
export function allocate(record: InventoryRecord, qty: number): InventoryRecord {
  if (qty <= 0) return record;
  if (freeStock(record) < qty) return record;
  return { ...record, allocated: record.allocated + qty };
}

/**
 * 引当を減らす（解放）。allocated が不足するか qty <= 0 の場合は no-op。
 * 二重解放しても safe（2回目以降は guard が効いて no-op）。
 */
export function release(record: InventoryRecord, qty: number): InventoryRecord {
  if (qty <= 0) return record;
  if (record.allocated < qty) return record;
  return { ...record, allocated: record.allocated - qty };
}

/**
 * 出荷確定で物理在庫から引いて引当も同時に減らす。
 * onHand または allocated が不足する場合、qty が非正の場合は no-op。
 */
export function consume(record: InventoryRecord, qty: number): InventoryRecord {
  if (qty <= 0) return record;
  if (record.allocated < qty) return record;
  if (record.onHand < qty) return record;
  return {
    ...record,
    onHand: record.onHand - qty,
    allocated: record.allocated - qty,
  };
}

/**
 * 発注入荷で物理在庫を加算する。allocated は触らない。
 * qty が非正の場合は no-op（参照同一性保持）。
 *
 * purchase-handlers の receiveInventory 記述子を InventoryRecord に適用するときに使う。
 */
export function receiveStock(record: InventoryRecord, qty: number): InventoryRecord {
  if (qty <= 0) return record;
  return { ...record, onHand: record.onHand + qty };
}
