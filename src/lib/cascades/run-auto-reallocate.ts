/**
 * 入荷時 自動再引当のUI向けグルー。
 *
 * 純粋 cascade（reallocate-on-receipt.ts）はストア注入でテスト可能に保ち、グローバル
 * シングルトンと設定の読み取りはこの薄い層に閉じ込める。各入荷ページ（発注 / 入荷登録 /
 * 返品の良品戻し）は applyReceive 直後にこの1関数を呼ぶだけでよい。
 *
 * 設定が OFF のときは何もしない（従来通り「引当自動実行」ページの手動バッチに委ねる）。
 */

import { orderStore } from "../stores/orders";
import { inventoryStore } from "../stores/inventory";
import { getAutoReallocateSettings } from "../inventory/auto-reallocate-settings";
import { reallocateOnReceipt, type ReallocateOnReceiptOptions } from "./reallocate-on-receipt";
import type { AllocationLine } from "../state-machines/inventory";
import type { AllocateOrdersResult } from "./allocate-orders";

const DISABLED: AllocateOrdersResult = { processed: 0, allocated: 0, shortage: 0 };

/**
 * 設定が有効なら、入荷した在庫明細をもとにグローバルストアで欠品受注を自動再引当する。
 * OFF または対象なしのときは processed=0 の結果を返す。
 */
export function runAutoReallocateOnReceipt(
  receivedLines: ReadonlyArray<AllocationLine>,
  options?: ReallocateOnReceiptOptions,
): AllocateOrdersResult {
  if (!getAutoReallocateSettings().enabled) return DISABLED;
  return reallocateOnReceipt({ orderStore, inventoryStore }, receivedLines, options);
}
