/**
 * 引当計算
 *
 * 仕様: docs/prd/inventory-state-machine.md §9（複数 SKU 横断 all-or-nothing 引当）
 *
 * 受注の必要数（複数SKU）と複数倉庫の InventoryRecord を入力に取り、
 * 引当可能かを判定して引当計画（OrderAllocation）を返す pure function。
 *
 * - 受注全体での all-or-nothing: いずれかのSKUで不足があれば全体失敗 + 不足明細を返す
 * - 同一SKUの複数倉庫分割: `options.allowMultiWarehouseSplit` で切替（デフォルト true）
 *   v1.1 以降で運用画面の設定として外出しする想定
 * - 倉庫の優先順位: 渡された `inventory` 配列の順序がそのまま優先順
 * - InventoryRecord は変更しない（plan を出すだけ。実引当は `inventory.allocate()` 経由）
 */

import { freeStock, type InventoryRecord, type OrderAllocation } from "../state-machines/inventory";

export interface AllocationDemandLine {
  sku: string;
  qty: number;
}

export interface AllocationDemand {
  orderId: string;
  lines: AllocationDemandLine[];
}

export interface AllocationShortage {
  sku: string;
  needed: number;
  /**
   * 引当に使える在庫数。
   * - 分割可モード: 全倉庫の freeStock 合計
   * - 単一倉庫モード: 単一倉庫で取れる最大 freeStock
   */
  available: number;
}

export type AllocationResult =
  | { ok: true; allocation: OrderAllocation }
  | { ok: false; shortages: AllocationShortage[] };

export interface AllocationOptions {
  /**
   * 同一SKUを複数倉庫に分割して引けるかどうか。
   * - true（デフォルト）: freeStock を倉庫順に消費。合計が需要に届けば成功
   * - false: 単一倉庫で全量を取れる必要がある。先頭から full-cover 可能な倉庫を採用
   *
   * 運用画面の設定で切替できるようにフラグ化（インタビュー回答 2026-05-15）。
   */
  allowMultiWarehouseSplit?: boolean;
}

interface SkuLineResult {
  /** 部分引当ライン（成功した場合のみ。失敗時は空） */
  lines: { sku: string; warehouse: string; qty: number }[];
  shortage?: AllocationShortage;
}

function planSku(
  sku: string,
  needed: number,
  records: InventoryRecord[],
  split: boolean,
): SkuLineResult {
  if (split) {
    return planSkuSplit(sku, needed, records);
  }
  return planSkuSingle(sku, needed, records);
}

function planSkuSplit(
  sku: string,
  needed: number,
  records: InventoryRecord[],
): SkuLineResult {
  const lines: SkuLineResult["lines"] = [];
  let remaining = needed;
  let totalAvailable = 0;

  for (const r of records) {
    const free = freeStock(r);
    totalAvailable += free;
    if (remaining <= 0) continue;
    if (free <= 0) continue;
    const take = Math.min(free, remaining);
    lines.push({ sku, warehouse: r.warehouse, qty: take });
    remaining -= take;
  }

  if (remaining > 0) {
    return { lines: [], shortage: { sku, needed, available: totalAvailable } };
  }
  return { lines };
}

function planSkuSingle(
  sku: string,
  needed: number,
  records: InventoryRecord[],
): SkuLineResult {
  let bestAvailable = 0;
  for (const r of records) {
    const free = freeStock(r);
    if (free >= needed) {
      return { lines: [{ sku, warehouse: r.warehouse, qty: needed }] };
    }
    if (free > bestAvailable) bestAvailable = free;
  }
  return { lines: [], shortage: { sku, needed, available: bestAvailable } };
}

/**
 * 受注の引当計画を計算する。
 *
 * 戻り値:
 *   - 成功: `{ ok: true, allocation }` — `inventory.allocate()` に渡せる lines を含む OrderAllocation
 *   - 失敗: `{ ok: false, shortages }` — 不足の出た SKU と needed/available の詳細
 *
 * 副作用なし。InventoryRecord は変更しない（plan を出すだけ）。
 */
export function allocateOrder(
  demand: AllocationDemand,
  inventory: InventoryRecord[],
  options: AllocationOptions = {},
): AllocationResult {
  const split = options.allowMultiWarehouseSplit ?? true;

  const allocationLines: { sku: string; warehouse: string; qty: number }[] = [];
  const shortages: AllocationShortage[] = [];

  for (const demandLine of demand.lines) {
    if (demandLine.qty <= 0) continue;
    const records = inventory.filter((r) => r.sku === demandLine.sku);
    const result = planSku(demandLine.sku, demandLine.qty, records, split);
    if (result.shortage !== undefined) {
      shortages.push(result.shortage);
    } else {
      allocationLines.push(...result.lines);
    }
  }

  if (shortages.length > 0) {
    return { ok: false, shortages };
  }

  return {
    ok: true,
    allocation: { orderId: demand.orderId, lines: allocationLines },
  };
}
