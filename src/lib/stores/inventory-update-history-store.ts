/**
 * 在庫更新処理（products/inventory/update）の実行履歴 共有マスタストア。
 *
 * モール在庫連携・倉庫API在庫取込・CSV手動取込の実行ログを id をキーに createMasterStore へ載せ、
 * 実行のたびに新しいジョブ履歴を追記する。リロード後も履歴を復元する。
 *
 * 永続化（domain: "inventory-update-history"）の正規オーナーページは
 * src/app/products/inventory/update/page.tsx。
 *
 * 注: これは実行「履歴」の永続化であり、実在庫数（domain: "inventory"）とは別物。
 * 実在庫の更新は在庫ストアのオーナーページが担当し、本ストアには触れない。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type InventoryUpdateResult = "成功" | "部分成功" | "失敗" | "実行中";

export interface InventoryUpdateHistoryRecord {
  id: string;
  type: string;
  target: string;
  started: string;
  ended: string;
  updated: number;
  total: number;
  result: InventoryUpdateResult;
  [extra: string]: unknown;
}

export const INITIAL_INVENTORY_UPDATE_HISTORY: InventoryUpdateHistoryRecord[] = [
  { id: "INV-UPD-20260425-003", type: "モール在庫連携", target: "楽天市場", started: "2026-04-25 16:30", ended: "2026-04-25 16:31", updated: 142, total: 142, result: "成功" },
  { id: "INV-UPD-20260425-002", type: "倉庫API在庫取込", target: "東京本社倉庫", started: "2026-04-25 09:15", ended: "2026-04-25 09:16", updated: 58, total: 58, result: "成功" },
  { id: "INV-UPD-20260425-001", type: "CSV手動取込", target: "大阪倉庫", started: "2026-04-25 08:40", ended: "2026-04-25 08:40", updated: 12, total: 12, result: "成功" },
  { id: "INV-UPD-20260424-045", type: "モール在庫連携", target: "Yahoo!ショッピング", started: "2026-04-24 23:00", ended: "2026-04-24 23:02", updated: 200, total: 205, result: "部分成功" },
  { id: "INV-UPD-20260424-040", type: "倉庫API在庫取込", target: "九州物流センター", started: "2026-04-24 09:00", ended: "2026-04-24 09:00", updated: 0, total: 84, result: "失敗" },
];

export const inventoryUpdateHistoryStore: MasterStore<InventoryUpdateHistoryRecord> =
  createMasterStore<InventoryUpdateHistoryRecord>(INITIAL_INVENTORY_UPDATE_HISTORY);
