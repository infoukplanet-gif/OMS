/**
 * 一括在庫引当 cascade（引当自動実行 / バッチ引当）
 *
 * 仕様: docs/prd/events-integration-v1.md
 *
 * 引当待ちの受注をまとめて在庫引当する。orders/page の per-order retryAllocate の
 * バッチ版で、引当自動実行ページ（products/allocation/auto）から呼ばれる。
 *
 * 各受注について:
 *   - inventoryStore.applyAllocate(allocation) が成功 → orderStore で allocateInventory
 *     遷移を打ち、受注を 引当待ち → 印刷待ち へ進める
 *   - 在庫不足で引当できない → markInventoryShortage（状態は引当待ちのまま、バッジを立てる）
 *
 * store は依存注入。fresh store でユニットテストできる。
 */

import type { OrderStore } from "../stores/orders";
import type { InventoryStore } from "../stores/inventory";
import type { AllocationLine } from "../state-machines/inventory";

export interface AllocateOrdersDeps {
  orderStore: OrderStore;
  inventoryStore: InventoryStore;
}

export interface AllocateOrdersOptions {
  /** 対象を特定の受注に限定する（未指定なら引当待ち全件）。 */
  orderIds?: ReadonlyArray<string>;
}

export interface AllocateOrdersResult {
  /** 引当待ちかつ引当明細ありで処理対象になった件数。 */
  processed: number;
  /** 引当成功して印刷待ちへ進んだ件数。 */
  allocated: number;
  /** 在庫不足マークした件数。 */
  shortage: number;
}

export function allocatePendingOrders(
  deps: AllocateOrdersDeps,
  options: AllocateOrdersOptions = {},
): AllocateOrdersResult {
  const { orderStore, inventoryStore } = deps;
  const { orderIds } = options;

  const targets = orderStore
    .getState()
    .filter((o) => o.status === "引当待ち" && (!orderIds || orderIds.includes(o.id)));

  let processed = 0;
  let allocated = 0;
  let shortage = 0;

  for (const o of targets) {
    const allocation = (o.allocation as AllocationLine[] | undefined) ?? [];
    if (allocation.length === 0) continue;
    processed += 1;

    const cascade = inventoryStore.applyAllocate(allocation);
    if (cascade.appliedCount > 0) {
      const res = orderStore.applyTransition(o.id, "allocateInventory");
      if (res.applied) allocated += 1;
    } else {
      const res = orderStore.applyTransition(o.id, "markInventoryShortage");
      if (res.applied) shortage += 1;
    }
  }

  return { processed, allocated, shortage };
}
