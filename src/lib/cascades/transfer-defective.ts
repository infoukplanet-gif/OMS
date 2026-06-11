/**
 * 不良品振替の実行 cascade（方向②）。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md
 *
 * 振替待ちレコードの execute で:
 *   1. 状態機械で 振替待ち → 振替完了 に遷移（defectiveStore.applyTransition）
 *   2. 振替元倉庫の良品 onHand を qty 分だけ実減算（inventoryStore.applyAdjust に負 delta）
 *
 * これで defective ページが従来から謳っていた「振替実行時に在庫数を更新」を実装する。
 * - 良品 onHand 減算のみ（allocated は不変・別バケットは持たない＝KISS）
 * - 冪等: 既に 振替完了 なら遷移が no-op になり、在庫も触らない（二重減算しない）
 * - (sku, warehouse) が在庫 record に無い場合は遷移だけ成立し unknownInventory=true を返す
 *
 * 純粋 + 依存注入（deps）。global singleton は run-transfer-defective.ts が束ねる。
 */

import type { DefectiveStore } from "../stores/defective";
import type { InventoryStore } from "../stores/inventory";

export interface TransferDefectiveDeps {
  defectiveStore: DefectiveStore;
  inventoryStore: InventoryStore;
}

export interface TransferDefectiveArgs {
  id: string;
}

export interface TransferDefectiveResult {
  /** 振替待ち → 振替完了 の遷移が成立したか。 */
  applied: boolean;
  /** onHand を実減算した在庫 record の件数（0 or 1）。 */
  decremented: number;
  /** 振替元 (sku, warehouse) がどの在庫 record にもマッチしなかったか。 */
  unknownInventory: boolean;
  /** 減算した数量（遷移不成立時は 0）。 */
  qty: number;
}

export function executeDefectiveTransfer(
  deps: TransferDefectiveDeps,
  args: TransferDefectiveArgs,
): TransferDefectiveResult {
  const { defectiveStore, inventoryStore } = deps;

  const transition = defectiveStore.applyTransition(args.id, "execute");
  if (!transition.applied || transition.record === null) {
    return { applied: false, decremented: 0, unknownInventory: false, qty: 0 };
  }

  const { sku, warehouse, qty } = transition.record;
  const adjust = inventoryStore.applyAdjust([{ sku, warehouse, delta: -qty }]);

  return {
    applied: true,
    decremented: adjust.appliedCount,
    unknownInventory: adjust.unknownAdjustments.length > 0,
    qty,
  };
}
