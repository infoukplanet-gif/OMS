/**
 * バーコード検品ページの初期シード。
 *
 * 永続化（domain: "inspections"）の正規オーナーページは
 * src/app/shipments/inspection-barcode/page.tsx。
 */

import type { InspectionRecord } from "../state-machines/inspection";

export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: "ORD-2026-00851",
    status: "検品中",
    items: [
      { sku: "WEP-001", name: "ワイヤレスイヤホン Pro", required: 2, scanned: 2 },
      { sku: "UCB-002", name: "USB-Cケーブル 2m", required: 3, scanned: 1 },
      { sku: "MBT-004", name: "モバイルバッテリー 20000mAh", required: 1, scanned: 0 },
      { sku: "PFS-005", name: "保護フィルム セット", required: 4, scanned: 4 },
    ],
  },
];
