/**
 * defectiveLotStore（ロット不良 / 不良欠品処理）の初期シード値。
 *
 * shipments/defective-shortage が正規オーナーとして空ストアにセットする初期データ。
 * SKU / 倉庫は INITIAL_INVENTORY に実在する (sku, warehouse) に揃えてあり、
 * 「台帳登録」→ 不良品振替ページの振替実行で実際に良品 onHand が減算される。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { LotDefectRecord } from "@/lib/state-machines/defective-lot";

export const INITIAL_DEFECTIVE_LOTS: LotDefectRecord[] = [
  { id: "DS-001", lot: "LOT-2026-04-12-A", sku: "WEP-001-BK", product: "ワイヤレスイヤホン Pro ブラック", warehouse: "東京本社倉庫", detected: 8, affected: 12, rootCause: "メーカー由来", reportedAt: "2026-04-25 09:00", status: "メーカー連絡済", responsibility: "メーカー", ledgerId: "DF-004" },
  { id: "DS-002", lot: "LOT-2026-04-08-B", sku: "MBT-004", product: "モバイルバッテリー 20000mAh", warehouse: "東京本社倉庫", detected: 3, affected: 5, rootCause: "輸送中破損", reportedAt: "2026-04-23 14:32", status: "代替手配中", responsibility: "配送業者" },
  { id: "DS-003", lot: "LOT-2026-04-05-A", sku: "TS-WH-M", product: "Tシャツ ホワイト M", warehouse: "九州物流センター", detected: 12, affected: 28, rootCause: "倉庫保管不良", reportedAt: "2026-04-22 10:00", status: "未対応", responsibility: "自社" },
  { id: "DS-004", lot: "LOT-2026-03-30-C", sku: "PFS-005", product: "保護フィルム セット", warehouse: "東京本社倉庫", detected: 4, affected: 4, rootCause: "原因調査中", reportedAt: "2026-04-20 16:18", status: "未対応", responsibility: "未確定" },
  { id: "DS-005", lot: "LOT-2026-03-25-A", sku: "UCB-002", product: "USB-Cケーブル 2m", warehouse: "大阪倉庫", detected: 2, affected: 8, rootCause: "メーカー由来", reportedAt: "2026-04-15 11:42", status: "全件対応完了", responsibility: "メーカー" },
];
