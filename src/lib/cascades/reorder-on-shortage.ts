/**
 * 欠品 → 発注 自動連鎖 cascade
 *
 * 仕様: docs/prd/events-integration-v1.md / docs/prd/purchase-state-machine.md §1
 *       インタビュー回答 2026-07-09（数量=両方併用 / 自動度=未発行PO起票 / 冪等=既存未発行POへマージ）
 *
 * 一括引当（allocatePendingOrders）でも解消できず「引当待ち」に留まった欠品受注から、
 * SKU×倉庫別の不足を算定し、仕入先ごとの「未発行」発注書へ冪等に集約する。
 * store は依存注入で、fresh store のユニットテストと本番シングルトン（run-* グルー）の
 * 双方に対応する。
 *
 * 副作用は purchaseStore への追記/更新のみ（在庫・受注は触らない）。連鎖途中で失敗しても
 * 在庫・受注状態は不変のため、ロールバックは不要（インタビュー回答 #3 の設計方針）。
 */

import type { OrderStore } from "../stores/orders";
import type { InventoryStore } from "../stores/inventory";
import type { PurchaseStore, PurchaseOrderRecord } from "../stores/purchase";
import { buildShortageReorderSuggestions } from "../calculations/shortage-demand";
import {
  mergeReorderIntoPurchaseOrders,
  nextPoSeq,
  type MergeablePurchaseOrder,
  type ReorderMasterMaps,
} from "../calculations/reorder-to-po";

const UNASSIGNED_SUPPLIER = "仕入先未設定";

export interface ReorderOnShortageDeps {
  orderStore: OrderStore;
  inventoryStore: InventoryStore;
  purchaseStore: PurchaseStore;
}

export interface ReorderOnShortageOptions {
  /** SKU → 仕入先 / 原価 のマスタ参照。 */
  maps: ReorderMasterMaps;
  /** 起票日（YYYY-MM-DD）。 */
  today: string;
  /** PO id の年部分。 */
  year: number;
}

export interface ReorderOnShortageResult {
  /** 発注推奨が立った SKU×倉庫 の数。 */
  shortageSkus: number;
  /** 新規に起票した未発行 PO 件数。 */
  created: number;
  /** 既存の未発行 PO を更新した件数。 */
  merged: number;
  /** 推奨発注数の合計。 */
  totalQty: number;
}

const EMPTY: ReorderOnShortageResult = { shortageSkus: 0, created: 0, merged: 0, totalQty: 0 };

/** purchaseStore のレコードを マージ層が読む構造型へ写像する（supplier 等の付帯フィールドを確定）。 */
function toMergeable(record: PurchaseOrderRecord): MergeablePurchaseOrder {
  return {
    ...record,
    supplier: typeof record.supplier === "string" ? record.supplier : UNASSIGNED_SUPPLIER,
    items: typeof record.items === "number" ? record.items : 0,
    amount: typeof record.amount === "number" ? record.amount : 0,
  };
}

/**
 * 欠品受注 → 未発行 PO の自動連鎖を実行する。
 * 欠品が無い、または起票・マージすべき変更が無い場合はストアを更新しない。
 */
export function runReorderOnShortage(
  deps: ReorderOnShortageDeps,
  options: ReorderOnShortageOptions,
): ReorderOnShortageResult {
  const { orderStore, inventoryStore, purchaseStore } = deps;
  const { maps, today, year } = options;

  const suggestions = buildShortageReorderSuggestions(
    orderStore.getState(),
    inventoryStore.getState(),
  );
  if (suggestions.length === 0) return EMPTY;

  const existing = purchaseStore.getState();
  const merge = mergeReorderIntoPurchaseOrders(
    existing.map(toMergeable),
    suggestions,
    maps,
    { today, year, startSeq: nextPoSeq(existing.map((p) => p.id)) },
  );

  if (merge.created > 0 || merge.merged > 0) {
    purchaseStore.setItems(merge.orders as unknown as PurchaseOrderRecord[]);
  }

  return {
    shortageSkus: suggestions.length,
    created: merge.created,
    merged: merge.merged,
    totalQty: suggestions.reduce((sum, s) => sum + s.suggestedQty, 0),
  };
}
