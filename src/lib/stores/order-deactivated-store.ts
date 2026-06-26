/**
 * 受注伝票有効化（orders/activate）の対象 = 無効化された受注伝票 共有マスタストア。
 *
 * 無効理由付きで保留中の無効伝票を id をキーに createMasterStore へ載せる。
 * 有効化すると該当行をストアから除去し、リロード後も「有効化済みの伝票は再表示しない」状態を保つ。
 *
 * 永続化（domain: "order-deactivated"）の正規オーナーページは
 * src/app/orders/activate/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface DeactivatedOrderRecord {
  id: string;
  reason: string;
  createdAt: string;
  [extra: string]: unknown;
}

export const INITIAL_DEACTIVATED_ORDERS: DeactivatedOrderRecord[] = [
  { id: "ORD-2024-00840", reason: "在庫不足", createdAt: "2026-04-12 10:34" },
  { id: "ORD-2024-00835", reason: "決済エラー", createdAt: "2026-04-12 09:18" },
  { id: "ORD-2024-00828", reason: "手動無効化", createdAt: "2026-04-11 17:44" },
  { id: "ORD-2024-00820", reason: "住所不備", createdAt: "2026-04-11 14:02" },
  { id: "ORD-2024-00815", reason: "決済エラー", createdAt: "2026-04-11 11:09" },
];

export const orderDeactivatedStore: MasterStore<DeactivatedOrderRecord> =
  createMasterStore<DeactivatedOrderRecord>(INITIAL_DEACTIVATED_ORDERS);
