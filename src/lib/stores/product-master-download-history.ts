/**
 * 商品マスタ全件ダウンロードの実行履歴 共有ストア（collection パターン）。
 *
 * products/master-download ページのダウンロード実行を id をキーにした複数レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "product-master-download-history"）の正規オーナーページは
 * src/app/products/master-download/page.tsx。
 *
 * 注: 設定系の汎用ダウンロード履歴（domain: "download-history"）は
 * settings/download-history が別レコード形（DownloadJobRecord）で所有しているため、
 * 商品マスタDLは別ドメイン・別ストアとして分離する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import {
  INITIAL_PRODUCT_MASTER_DOWNLOAD_HISTORY,
  type ProductMasterDownloadBatch,
} from "../seeds/product-master-download-history";

export type { ProductMasterDownloadBatch } from "../seeds/product-master-download-history";

export const productMasterDownloadHistoryStore: MasterStore<ProductMasterDownloadBatch> =
  createMasterStore<ProductMasterDownloadBatch>(INITIAL_PRODUCT_MASTER_DOWNLOAD_HISTORY);
