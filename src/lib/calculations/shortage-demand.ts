/**
 * 欠品需要の算定（引当不足 → 発注数）
 *
 * 仕様: docs/prd/events-integration-v1.md / docs/prd/purchase-state-machine.md §1
 *
 * 一括引当（allocatePendingOrders）でも解消できず「引当待ち」に留まった欠品受注から、
 * SKU×倉庫ごとの不足実数を集計し、発注すべき推奨数へ変換する pure function 群。
 *
 * 数量算定は「両方併用」（インタビュー回答 2026-07-09）:
 *   推奨発注数 = max(欠品実数, 発注点補充数)
 *     - 欠品実数     … 欠品受注の需要合計 − 現在のフリー在庫（負のフリーは 0 とみなす）
 *     - 発注点補充数 … recommendReorderQty()（ロット単位で適正在庫まで補充）
 *
 * 引当計算（reorder-calculation）と同じ ReorderSuggestion 型で返すため、
 * 出力はそのまま buildPurchaseOrdersFromReorder に流し込める。
 */

import { freeStock, type AllocationLine, type InventoryRecord } from "../state-machines/inventory";
import { recommendReorderQty, type ReorderSuggestion } from "./reorder-calculation";

/** 欠品判定に必要な受注フィールドだけを受ける構造型（OrderRecord のサブセット）。 */
export interface ShortageOrderInput {
  status: string;
  inventoryShortage?: boolean;
  allocation?: AllocationLine[];
}

/** SKU×倉庫ごとの不足実数。 */
export interface ShortageDemandLine {
  sku: string;
  warehouse: string;
  /** 需要合計 − フリー在庫（> 0 のみ）。 */
  shortQty: number;
}

const key = (sku: string, warehouse: string) => `${sku}@@${warehouse}`;

/** 負値（過引当）を 0 に丸めた実質フリー在庫のマップ。 */
function availableFreeMap(records: ReadonlyArray<InventoryRecord>): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(key(r.sku, r.warehouse), Math.max(0, freeStock(r)));
  }
  return map;
}

/**
 * 引当できずに「引当待ち」へ留まった欠品受注から、SKU×倉庫別の不足実数を集計する。
 *
 * - 対象は status "引当待ち" かつ inventoryShortage === true の受注のみ
 * - 各受注の allocation（需要明細）を SKU×倉庫で合算
 * - 不足 = 需要合計 − 実質フリー在庫。0 以下は除外
 * - 出力順は SKU×倉庫の初出順で安定
 */
export function computeShortageDemand(
  orders: ReadonlyArray<ShortageOrderInput>,
  records: ReadonlyArray<InventoryRecord>,
): ShortageDemandLine[] {
  const free = availableFreeMap(records);
  const order: string[] = [];
  const demand = new Map<string, { sku: string; warehouse: string; qty: number }>();

  for (const o of orders) {
    if (o.status !== "引当待ち" || o.inventoryShortage !== true) continue;
    for (const line of o.allocation ?? []) {
      const k = key(line.sku, line.warehouse);
      const existing = demand.get(k);
      if (existing) {
        existing.qty += line.qty;
      } else {
        demand.set(k, { sku: line.sku, warehouse: line.warehouse, qty: line.qty });
        order.push(k);
      }
    }
  }

  const result: ShortageDemandLine[] = [];
  for (const k of order) {
    const d = demand.get(k)!;
    const shortQty = d.qty - (free.get(k) ?? 0);
    if (shortQty > 0) {
      result.push({ sku: d.sku, warehouse: d.warehouse, shortQty });
    }
  }
  return result;
}

/**
 * 欠品受注から発注推奨（ReorderSuggestion）を導出する。
 * 数量は max(欠品実数, 発注点補充数) の「両方併用」。
 */
export function buildShortageReorderSuggestions(
  orders: ReadonlyArray<ShortageOrderInput>,
  records: ReadonlyArray<InventoryRecord>,
): ReorderSuggestion[] {
  const shortage = computeShortageDemand(orders, records);
  return shortage.map((line) => {
    const record = records.find((r) => r.sku === line.sku && r.warehouse === line.warehouse);
    const reorderQty = record ? recommendReorderQty(record) : 0;
    return {
      sku: line.sku,
      warehouse: line.warehouse,
      currentFree: record ? freeStock(record) : 0,
      suggestedQty: Math.max(line.shortQty, reorderQty),
    };
  });
}
