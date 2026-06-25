/**
 * bulkCompleteOrderStore（一括注文完了）の初期シード値。
 *
 * orders/bulk-complete が正規オーナーとして空ストアにセットする初期データ。
 * 完了前の受注（確認待ち・引当済・出荷待ち）と、完了済になったレコードを
 * すべてストアで管理する（完了済はページのフィルタで非表示にする）。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { BulkCompleteOrderRecord } from "@/lib/state-machines/bulk-complete-order";

export const INITIAL_BULK_COMPLETE_ORDERS: BulkCompleteOrderRecord[] = [
  { id: "ORD-2026-01102", customer: "株式会社サンプル", status: "出荷待ち", amount: 38400, orderedAt: "2026-04-22" },
  { id: "ORD-2026-01101", customer: "山田太郎",         status: "出荷待ち", amount: 12800, orderedAt: "2026-04-22" },
  { id: "ORD-2026-01098", customer: "田中一郎",         status: "引当済",   amount: 5600,  orderedAt: "2026-04-22" },
  { id: "ORD-2026-01095", customer: "鈴木商事",         status: "出荷待ち", amount: 92400, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01092", customer: "伊藤大輔",         status: "確認待ち", amount: 18700, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01090", customer: "株式会社ABC",      status: "引当済",   amount: 125800, orderedAt: "2026-04-21" },
  { id: "ORD-2026-01088", customer: "小林修",           status: "出荷待ち", amount: 3280,  orderedAt: "2026-04-20" },
];
