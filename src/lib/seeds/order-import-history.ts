/**
 * 受注一括登録の取込履歴シード。
 *
 * orders/import ページが取込を確定するたびに 1 レコード追記される
 * （id をキーにした collection ストア）。
 */

export interface OrderImportBatch {
  id: string;
  filename: string;
  rows: number;
  success: number;
  warning: number;
  error: number;
  template: string;
  user: string;
  at: string;
  [extra: string]: unknown;
}

export const INITIAL_ORDER_IMPORT_HISTORY: OrderImportBatch[] = [
  { id: "ORDIMP-20260424-1805", filename: "rakuten_orders_20260424.csv", rows: 187, success: 184, warning: 2, error: 1, template: "楽天CSV用", user: "佐藤 花子", at: "2026-04-24 18:05" },
  { id: "ORDIMP-20260423-1732", filename: "amazon_orders_20260423.csv", rows: 92, success: 92, warning: 0, error: 0, template: "Amazon用", user: "田中 太郎", at: "2026-04-23 17:32" },
  { id: "ORDIMP-20260422-1118", filename: "wholesale_a_april.xlsx", rows: 45, success: 43, warning: 1, error: 1, template: "卸先A用", user: "鈴木 一郎", at: "2026-04-22 11:18" },
];
