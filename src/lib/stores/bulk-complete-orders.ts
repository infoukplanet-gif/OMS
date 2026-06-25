/**
 * 一括注文完了 共有ストア。
 *
 * orders/bulk-complete ページの受注行（伝票番号/顧客/ステータス/金額/受注日）を
 * id をキーにした複数レコードとして createMasterStore に載せ、
 * 一括完了処理をリロード後も復元する。
 *
 * ステータス遷移は state-machine transitionBulkCompleteOrder を経由する
 * （ページで status を直書きしない）。
 *
 * 永続化（domain: "bulk-complete-orders"）の正規オーナーページは
 * src/app/orders/bulk-complete/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { BulkCompleteOrderRecord } from "@/lib/state-machines/bulk-complete-order";
import { INITIAL_BULK_COMPLETE_ORDERS } from "@/lib/seeds/bulk-complete-orders";

export const bulkCompleteOrderStore: MasterStore<BulkCompleteOrderRecord> =
  createMasterStore<BulkCompleteOrderRecord>(INITIAL_BULK_COMPLETE_ORDERS);
