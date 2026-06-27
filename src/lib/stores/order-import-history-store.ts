/**
 * 受注一括登録の取込履歴ストア。
 *
 * orders/import ページがオーナーで、取込確定のたびに 1 バッチ追記する。
 * usePersistentStore で "order-import-history" ドメインへ永続化する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_ORDER_IMPORT_HISTORY, type OrderImportBatch } from "../seeds/order-import-history";

export type { OrderImportBatch } from "../seeds/order-import-history";

export const orderImportHistoryStore: MasterStore<OrderImportBatch> =
  createMasterStore<OrderImportBatch>(INITIAL_ORDER_IMPORT_HISTORY);
