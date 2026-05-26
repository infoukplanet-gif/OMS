/**
 * 受注の引当計画（ルール適用つき）
 *
 * 受注が持つ引当明細（sku+warehouse+qty）を「倉庫非依存の需要（sku+qty）」に集約し、
 * 引当ルール（倉庫優先順 / 分割可否）を適用して allocateOrder で実際に引き当てる
 * 倉庫別ラインを算出する。
 *
 * - 倉庫優先順: rules.warehousePriority の順に在庫を並べて allocateOrder に渡す
 * - 分割可否: rules.allowSplit を allocateOrder の allowMultiWarehouseSplit に渡す
 * - 副作用なし（純粋関数）。実引当は呼び出し元が inventoryStore.applyAllocate で行う。
 */

import { allocateOrder, type AllocationResult } from "../calculations/allocation";
import type { AllocationLine, InventoryRecord } from "../state-machines/inventory";
import { warehouseRank, type AllocationRules } from "./rules";

/**
 * 受注の引当明細（需要）と現在在庫から、ルール適用後の引当計画を返す。
 *
 * @param orderId 受注番号
 * @param allocation 受注の引当明細（warehouse は需要集約で無視し sku+qty のみ使う）
 * @param inventory 現在の在庫レコード（全倉庫）
 * @param rules 引当ルール（倉庫優先順 / 分割可否）
 */
export function planOrderAllocation(
  orderId: string,
  allocation: ReadonlyArray<AllocationLine>,
  inventory: ReadonlyArray<InventoryRecord>,
  rules: AllocationRules,
): AllocationResult {
  // 需要を sku 単位に集約（倉庫指定は捨てる＝どの倉庫から引いてもよい）
  const demandMap = new Map<string, number>();
  for (const line of allocation) {
    if (line.qty <= 0) continue;
    demandMap.set(line.sku, (demandMap.get(line.sku) ?? 0) + line.qty);
  }
  const lines = [...demandMap].map(([sku, qty]) => ({ sku, qty }));

  // 倉庫優先順に在庫を並べる（allocateOrder は配列順に消費する）
  const sorted = [...inventory].sort(
    (a, b) =>
      warehouseRank(a.warehouse, rules.warehousePriority) -
      warehouseRank(b.warehouse, rules.warehousePriority),
  );

  return allocateOrder(
    { orderId, lines },
    sorted,
    { allowMultiWarehouseSplit: rules.allowSplit },
  );
}
