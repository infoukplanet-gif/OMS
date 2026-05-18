/**
 * 発注計算
 *
 * 仕様: docs/prd/inventory-state-machine.md §9 / docs/prd/purchase-state-machine.md §1
 *
 * InventoryRecord の発注点（reorder）・適正在庫（constant）・発注ロット（lot）から
 * 発注すべき数量を導出する pure function 群。
 * v1 デフォルトの算定式は **ロット単位で適正在庫まで補充**（インタビュー回答 2026-05-15）:
 *
 *   ceil((constant - freeStock) / lot) * lot
 *
 * 発火条件は inventoryHealth() の "発注対象" と同じ判定（freeStock <= reorder）。
 */

import { freeStock, type InventoryRecord } from "../state-machines/inventory";

export interface ReorderSuggestion {
  sku: string;
  warehouse: string;
  /** 現在の引当可能在庫（onHand - allocated）。負値もあり得る（過引当）。 */
  currentFree: number;
  /** 推奨発注数。ロット単位で適正在庫まで補充する量。 */
  suggestedQty: number;
}

/**
 * 単一 InventoryRecord に対する推奨発注数を計算する。
 *
 *  - freeStock > reorder（発注点を超えている）→ 0
 *  - constant <= freeStock（適正在庫に達している）→ 0
 *  - lot <= 0（不正設定）→ ロット丸めをスキップして (constant - freeStock) を返す
 *  - それ以外 → ceil((constant - freeStock) / lot) * lot
 */
export function recommendReorderQty(record: InventoryRecord): number {
  const free = freeStock(record);
  if (free > record.reorder) return 0;
  const gap = record.constant - free;
  if (gap <= 0) return 0;
  if (record.lot <= 0) return gap;
  return Math.ceil(gap / record.lot) * record.lot;
}

/**
 * 複数 InventoryRecord から発注すべき SKU×倉庫を抽出し、推奨発注数つきの一覧を返す。
 * 発注不要（qty=0）の record は除外する。
 */
export function reorderSuggestions(records: InventoryRecord[]): ReorderSuggestion[] {
  const result: ReorderSuggestion[] = [];
  for (const r of records) {
    const qty = recommendReorderQty(r);
    if (qty <= 0) continue;
    result.push({
      sku: r.sku,
      warehouse: r.warehouse,
      currentFree: freeStock(r),
      suggestedQty: qty,
    });
  }
  return result;
}
