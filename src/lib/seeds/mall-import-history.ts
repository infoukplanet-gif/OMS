/**
 * モール商品一括登録の取込履歴シード。
 *
 * products/mall-import ページの「取込履歴」テーブルの初期表示に使う。
 * 1 レコード = 1 回のモールCSV取込（モール・ファイル名・行数・成功/エラー件数）。
 */

/** 1 回のモール商品取込バッチ。 */
export interface MallImportBatch {
  id: string;
  /** モール表示名（例: "楽天市場"）。 */
  mall: string;
  filename: string;
  /** 取込ファイルのデータ行数。 */
  rows: number;
  /** 商品マスタへ反映できた件数。 */
  success: number;
  /** 取り込めなかった件数（コード空・重複スキップ等）。 */
  error: number;
  /** 実行日時（YYYY-MM-DD HH:MM）。 */
  at: string;
  /** createMasterStore の MasterRecord 制約（id 以外の任意項目）を満たすための索引シグネチャ。 */
  [extra: string]: unknown;
}

export const INITIAL_MALL_IMPORT_HISTORY: MallImportBatch[] = [
  { id: "MALLB-20260423-1705", mall: "楽天市場", filename: "item_20260423.csv", rows: 512, success: 508, error: 4, at: "2026-04-23 17:05" },
  { id: "MALLB-20260422-1012", mall: "Amazon", filename: "Inventory_Template.txt", rows: 230, success: 230, error: 0, at: "2026-04-22 10:12" },
  { id: "MALLB-20260419-1433", mall: "Shopify", filename: "products_export_1.csv", rows: 145, success: 144, error: 1, at: "2026-04-19 14:33" },
];
