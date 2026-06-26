/**
 * バーコード検品 共有ストア（collection パターン）。
 *
 * shipments/inspection-barcode ページの検品セッション（受注番号をキーに、SKUごとの
 * 必要数/スキャン済み数と検品ステータス）を id をキーにした複数レコードとして
 * createMasterStore に載せ、スキャン進捗をリロード後も復元する。
 *
 * 状態遷移は state-machine transitionInspection / resolveScan を経由する
 * （ページで status や scanned を直書きしない）。
 *
 * 永続化（domain: "inspections"）の正規オーナーページは
 * src/app/shipments/inspection-barcode/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { InspectionRecord } from "../state-machines/inspection";
import { INITIAL_INSPECTIONS } from "../seeds/inspection";

export const inspectionStore: MasterStore<InspectionRecord> =
  createMasterStore<InspectionRecord>(INITIAL_INSPECTIONS);
