/**
 * モール商品一括登録の取込履歴 共有ストア（collection パターン）。
 *
 * products/mall-import ページのモールCSV取込バッチを id をキーにした複数レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "mall-import-history"）の正規オーナーページは
 * src/app/products/mall-import/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import {
  INITIAL_MALL_IMPORT_HISTORY,
  type MallImportBatch,
} from "../seeds/mall-import-history";

export type { MallImportBatch } from "../seeds/mall-import-history";

export const mallImportHistoryStore: MasterStore<MallImportBatch> =
  createMasterStore<MallImportBatch>(INITIAL_MALL_IMPORT_HISTORY);
