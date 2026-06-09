/**
 * 入荷→欠品受注の自動再引当 cascade
 *
 * 仕様: docs/prd/reallocate-on-receipt-v1.md
 *
 * 入荷で在庫 onHand が増えたとき、在庫不足（inventoryShortage=true）で引当待ちに滞留して
 * いた受注のうち「今回入荷した SKU を需要に含むもの」だけを再引当する。既存の
 * allocatePendingOrders（欠品リトライ込み）を、対象を絞った形で再利用するだけの薄い層。
 *
 * 設計判断（docs/prd 参照）:
 *   - 発火範囲 : 在庫を増やす全入荷ポイント（発注入荷 / 入荷登録 / 返品の良品戻し）
 *   - スコープ : 入荷 SKU を需要に含む欠品受注のみ（無関係な受注は触らない）
 *   - 対象状態: 引当待ち かつ inventoryShortage=true のみ。
 *               shortage=false（引当済みで前進待ち）は入荷イベントの責務外＝手動バッチの役割。
 *   - 冪等性  : 成功すると印刷待ちへ前進し対象から外れるため、二度目の入荷では再処理されない。
 *   - 失敗時  : 在庫がまだ足りなければ引当待ちのまま（shortage 計上）。入荷自体（applyReceive）は
 *               既に成功済みで、再引当の失敗で在庫加算をロールバックしない（連鎖は止めない）。
 *
 * store は依存注入。fresh store でユニットテストできる。
 * ON/OFF は呼び出し元（各入荷ページ）が getAutoReallocateSettings() で判定する。
 */

import type { AllocationLine } from "../state-machines/inventory";
import {
  allocatePendingOrders,
  type AllocateOrdersDeps,
  type AllocateOrdersResult,
} from "./allocate-orders";
import type { AllocationRules } from "../allocation/rules";

export interface ReallocateOnReceiptOptions {
  /** 引当ルール（倉庫優先順 / 分割可否 / 受注処理順）。未指定はグローバル設定。 */
  rules?: AllocationRules;
}

const EMPTY_RESULT: AllocateOrdersResult = { processed: 0, allocated: 0, shortage: 0 };

/**
 * 入荷した在庫明細を受け取り、関連する欠品受注を再引当する。
 *
 * @param receivedLines applyReceive に渡したのと同じ入荷明細（SKU だけ参照する）。
 */
export function reallocateOnReceipt(
  deps: AllocateOrdersDeps,
  receivedLines: ReadonlyArray<AllocationLine>,
  options: ReallocateOnReceiptOptions = {},
): AllocateOrdersResult {
  const receivedSkus = new Set(receivedLines.map((l) => l.sku));
  if (receivedSkus.size === 0) return EMPTY_RESULT;

  // 入荷 SKU を需要に含む「欠品（引当待ち + shortage）」受注だけに絞る
  const targetIds = deps.orderStore
    .getState()
    .filter((o) => o.status === "引当待ち" && o.inventoryShortage === true)
    .filter((o) => {
      const demand = (o.allocation as AllocationLine[] | undefined) ?? [];
      return demand.some((d) => receivedSkus.has(d.sku));
    })
    .map((o) => o.id);

  if (targetIds.length === 0) return EMPTY_RESULT;

  return allocatePendingOrders(deps, { orderIds: targetIds, rules: options.rules });
}
