/**
 * 商品マスタ全件ダウンロードの実行履歴シード。
 *
 * products/master-download ページがダウンロードを実行するたびに
 * 1 レコード追記される（id をキーにした collection ストア）。
 */

export interface ProductMasterDownloadBatch {
  id: string;
  filename: string;
  count: number;
  format: string;
  user: string;
  at: string;
  [extra: string]: unknown;
}

export const INITIAL_PRODUCT_MASTER_DOWNLOAD_HISTORY: ProductMasterDownloadBatch[] = [
  {
    id: "PMDL-20260423-1122",
    filename: "products_20260423.csv",
    count: 1842,
    format: "CSV (UTF-8)",
    user: "佐藤 花子",
    at: "2026-04-23 11:22",
  },
  {
    id: "PMDL-20260418-0930",
    filename: "products_rakuten.xlsx",
    count: 820,
    format: "Excel",
    user: "田中 太郎",
    at: "2026-04-18 09:30",
  },
];
