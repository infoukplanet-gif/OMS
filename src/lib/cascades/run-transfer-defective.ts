/**
 * 不良品振替の実行 glue（global singleton 隔離層）。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md
 *
 * 純粋 cascade executeDefectiveTransfer に defectiveStore / inventoryStore
 * シングルトンを束ねる薄い接着剤。shipments/defective の振替実行ボタンが 1 行で呼ぶ。
 */

import { defectiveStore } from "../stores/defective";
import { inventoryStore } from "../stores/inventory";
import {
  executeDefectiveTransfer,
  type TransferDefectiveArgs,
  type TransferDefectiveResult,
} from "./transfer-defective";

export function runDefectiveTransfer(
  args: TransferDefectiveArgs,
): TransferDefectiveResult {
  return executeDefectiveTransfer({ defectiveStore, inventoryStore }, args);
}
