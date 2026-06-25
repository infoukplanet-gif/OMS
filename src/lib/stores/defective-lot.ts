/**
 * ロット不良（不良欠品処理）共有マスタストア（collection パターン）。
 *
 * shipments/defective-shortage ページのロット不良行（ロット/SKU/商品/倉庫/検出不良数/
 * 影響受注数/原因/責任区分/状態/台帳連携ID）を id をキーにした複数レコードとして
 * createMasterStore に載せ、新規登録・状態遷移・台帳連携をリロード後も復元する。
 *
 * 状態遷移は state-machine transitionLotDefect を経由する（ページで status を直書きしない）。
 *
 * 永続化（domain: "shipment-defective-lots"）の正規オーナーページは
 * src/app/shipments/defective-shortage/page.tsx。
 *
 * 注: 不良品振替台帳そのもの（承認・振替実行）は defectiveStore（domain "defective"）、
 * 一括振替の振替行は shipmentDefectiveTransferStore が別ドメインで保持する。本ストアは
 * ロット不良の対応進捗だけを担当する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { LotDefectRecord } from "../state-machines/defective-lot";
import { INITIAL_DEFECTIVE_LOTS } from "../seeds/defective-lot";

export const defectiveLotStore: MasterStore<LotDefectRecord> =
  createMasterStore<LotDefectRecord>(INITIAL_DEFECTIVE_LOTS);
