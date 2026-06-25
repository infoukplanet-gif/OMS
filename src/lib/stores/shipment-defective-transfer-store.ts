/**
 * 不良品振替（一括）共有マスタストア（collection パターン）。
 *
 * shipments/defective-transfer ページの振替行（受注/商品/SKU/数量/理由/振替元/
 * 振替先/状態）を id をキーにした複数レコードとして createMasterStore に載せ、
 * 新規登録・状態変更（実行→振替完了）をリロード後も復元する。
 *
 * 永続化（domain: "shipment-defective-transfer-settings"）の正規オーナーページは
 * src/app/shipments/defective-transfer/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type DefectiveTransferStatus = "承認待ち" | "振替待ち" | "振替完了";

export interface DefectiveTransferRecord {
  id: string;
  order: string;
  product: string;
  sku: string;
  qty: number;
  reason: string;
  from: string;
  to: string;
  status: DefectiveTransferStatus;
  [extra: string]: unknown;
}

export const INITIAL_DEFECTIVE_TRANSFER: DefectiveTransferRecord[] = [
  { id: "DT-001", order: "ORD-2026-00842", product: "Tシャツ ホワイト M", sku: "TS-WH-M", qty: 2, reason: "検品不良", from: "東京本社倉庫", to: "返品倉庫", status: "振替待ち" },
  { id: "DT-002", order: "ORD-2026-00838", product: "スニーカー ブラック 27cm", sku: "SN-BK-27", qty: 1, reason: "配送中破損", from: "東京本社倉庫", to: "返品倉庫", status: "振替完了" },
  { id: "DT-003", order: "ORD-2026-00835", product: "ジャケット ネイビー L", sku: "JK-NV-L", qty: 1, reason: "色違い", from: "大阪倉庫", to: "返品倉庫", status: "承認待ち" },
  { id: "DT-004", order: "ORD-2026-00829", product: "ワイヤレスイヤホン Pro", sku: "WEP-001", qty: 3, reason: "充電不良", from: "九州物流センター", to: "メーカー返却", status: "振替待ち" },
];

export const shipmentDefectiveTransferStore: MasterStore<DefectiveTransferRecord> =
  createMasterStore<DefectiveTransferRecord>(INITIAL_DEFECTIVE_TRANSFER);
