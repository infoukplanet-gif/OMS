/**
 * 発注点割れ在庫アラートの抽出（pure function）。
 *
 * 仕様: docs/prd/events-integration-v1.md（在庫引当時に発注点を下回る → 発注アラート）
 *
 * inventoryHealth() の判定式（"発注対象" / "在庫切れ"）と推奨発注数（recommendReorderQty）を
 * 組み合わせて、アラート対象 SKU を 1 行ずつ抽出する。danger（在庫切れ）優先 → free の少ない順で
 * ソートする。
 *
 * ダッシュボードや在庫一覧から useMemo で呼び、引当/消費/発注などで inventoryStore が
 * 更新されると即座に再計算される。
 */

import { freeStock, inventoryHealth, type InventoryRecord } from "../state-machines/inventory";
import { recommendReorderQty } from "../calculations/reorder-calculation";

export interface ReorderAlert {
  sku: string;
  warehouse: string;
  /** 現在の引当可能在庫（onHand - allocated）。過引当時は負値。 */
  currentFree: number;
  /** 発注点。 */
  reorderPoint: number;
  /** 適正在庫。 */
  constant: number;
  /** ロット単位で適正在庫まで補充するための推奨発注数。 */
  suggestedQty: number;
  /** 在庫切れ（onHand<=0 かつ free<=0）なら true。 */
  danger: boolean;
}

/**
 * 発注対象/在庫切れの在庫レコードを {@link ReorderAlert} に展開する。
 * 適正在庫・過剰在庫は除外。danger 優先 → currentFree 昇順でソート。
 */
export function extractReorderAlerts(records: ReadonlyArray<InventoryRecord>): ReorderAlert[] {
  const alerts: ReorderAlert[] = [];
  for (const record of records) {
    const health = inventoryHealth(record);
    if (health !== "発注対象" && health !== "在庫切れ") continue;
    alerts.push({
      sku: record.sku,
      warehouse: record.warehouse,
      currentFree: freeStock(record),
      reorderPoint: record.reorder,
      constant: record.constant,
      suggestedQty: recommendReorderQty(record),
      danger: health === "在庫切れ",
    });
  }
  return alerts.sort((a, b) => {
    if (a.danger !== b.danger) return a.danger ? -1 : 1;
    return a.currentFree - b.currentFree;
  });
}
