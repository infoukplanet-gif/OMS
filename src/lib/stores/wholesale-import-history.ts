/**
 * 卸先マスタ一括登録の取込履歴 共有ストア（collection パターン）。
 *
 * customers/wholesale/import ページの取込確定を id をキーにした複数レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "wholesale-import-history"）の正規オーナーページは
 * src/app/customers/wholesale/import/page.tsx。
 *
 * 注: 取込確定で実データを書き込む先（卸先マスタ本体）は domain "wholesale" を
 * customers/wholesale が所有している。本ストアは「いつ・何件・誰が取り込んだか」の
 * 実行履歴のみを担う別ドメイン・別ストアとして分離する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import {
  INITIAL_WHOLESALE_IMPORT_HISTORY,
  type WholesaleImportBatch,
} from "../seeds/wholesale-import-history";

export type {
  WholesaleImportBatch,
  WholesaleImportMode,
} from "../seeds/wholesale-import-history";

export const wholesaleImportHistoryStore: MasterStore<WholesaleImportBatch> =
  createMasterStore<WholesaleImportBatch>(INITIAL_WHOLESALE_IMPORT_HISTORY);
