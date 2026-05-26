/**
 * 一括在庫引当 cascade（引当自動実行 / バッチ引当）
 *
 * 仕様: docs/prd/events-integration-v1.md
 *
 * 引当待ちの受注をまとめて在庫引当する。orders/page の per-order retryAllocate の
 * バッチ版で、引当自動実行ページ（products/allocation/auto）から呼ばれる。
 *
 * 引当待ちには2種類ある（二重引当を避けるため区別する）:
 *   1. inventoryShortage=false … 引当待ち到達時に在庫引当済み（order-confirmed cascade）。
 *      在庫を再引当せず、allocateInventory 遷移で 印刷待ち へ前進させるだけ。
 *   2. inventoryShortage=true  … 到達時の引当が在庫不足で失敗。今回 applyAllocate で
 *      リトライし、成功したら 印刷待ち へ前進。依然不足ならそのまま（shortage に計上）。
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
  /** 印刷待ちへ前進した件数（引当済みの前進 + 在庫不足リトライ成功の合算）。 */
  allocated: number;
  /** リトライしても在庫不足で前進できなかった件数。 */
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

    // 引当済み（shortage でない）→ 在庫を触らず印刷待ちへ前進するだけ（二重引当回避）
    if (o.inventoryShortage !== true) {
      const res = orderStore.applyTransition(o.id, "allocateInventory");
      if (res.applied) allocated += 1;
      continue;
    }

    // 在庫不足のリトライ
    const cascade = inventoryStore.applyAllocate(allocation);
    if (cascade.appliedCount > 0) {
      const res = orderStore.applyTransition(o.id, "allocateInventory");
      if (res.applied) allocated += 1;
    } else {
      shortage += 1;
    }
  }

  return { processed, allocated, shortage };
}
