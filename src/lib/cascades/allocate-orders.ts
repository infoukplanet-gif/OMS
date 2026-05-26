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

import type { OrderRecord, OrderStore } from "../stores/orders";
import type { InventoryStore } from "../stores/inventory";
import type { AllocationLine } from "../state-machines/inventory";
import { planOrderAllocation } from "../allocation/plan";
import { getAllocationRules, type AllocationRules, type OrderByRule } from "../allocation/rules";

export interface AllocateOrdersDeps {
  orderStore: OrderStore;
  inventoryStore: InventoryStore;
}

export interface AllocateOrdersOptions {
  /** 対象を特定の受注に限定する（未指定なら引当待ち全件）。 */
  orderIds?: ReadonlyArray<string>;
  /** 引当ルール（倉庫優先順 / 分割可否 / 受注処理順）。未指定はグローバル設定。 */
  rules?: AllocationRules;
}

/** 受注処理順の比較関数を返す。在庫が競合する時の取り合い順。 */
function orderComparator(orderBy: OrderByRule): (a: OrderRecord, b: OrderRecord) => number {
  if (orderBy === "金額降順") {
    return (a, b) => ((b.amount as number) ?? 0) - ((a.amount as number) ?? 0);
  }
  if (orderBy === "受注日昇順") {
    return (a, b) => String(a.date ?? "").localeCompare(String(b.date ?? ""));
  }
  return () => 0; // 登録順（安定ソートで元順序維持）
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
  const rules = options.rules ?? getAllocationRules();

  const targets = orderStore
    .getState()
    .filter((o) => o.status === "引当待ち" && (!orderIds || orderIds.includes(o.id)))
    // 受注処理順（在庫が競合する時の取り合い順）
    .slice()
    .sort(orderComparator(rules.orderBy));

  let processed = 0;
  let allocated = 0;
  let shortage = 0;

  for (const o of targets) {
    const demand = (o.allocation as AllocationLine[] | undefined) ?? [];
    if (demand.length === 0) continue;
    processed += 1;

    // 引当済み（shortage でない）→ 在庫を触らず印刷待ちへ前進するだけ（二重引当回避）
    if (o.inventoryShortage !== true) {
      const res = orderStore.applyTransition(o.id, "allocateInventory");
      if (res.applied) allocated += 1;
      continue;
    }

    // 在庫不足のリトライ: ルール適用で再計画
    const plan = planOrderAllocation(o.id, demand, inventoryStore.getState(), rules);
    if (plan.ok && plan.allocation.lines.length > 0) {
      const cascade = inventoryStore.applyAllocate(plan.allocation.lines);
      if (cascade.appliedCount > 0) {
        orderStore.patch(o.id, { allocation: plan.allocation.lines });
        const res = orderStore.applyTransition(o.id, "allocateInventory");
        if (res.applied) allocated += 1;
      } else {
        shortage += 1;
      }
    } else {
      shortage += 1;
    }
  }

  return { processed, allocated, shortage };
}
