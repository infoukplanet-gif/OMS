/**
 * defectiveStore の初期シード値。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md
 *
 * shipments/defective が正規オーナーとして空ストアにセットする初期データ。
 * SKU / 倉庫は INITIAL_INVENTORY に実在する (sku, warehouse) に揃えてあり、
 * 振替待ちレコードを実行すると実際に良品 onHand が減算される。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { DefectiveRecord } from "@/lib/state-machines/defective";

export const INITIAL_DEFECTIVE: DefectiveRecord[] = [
  {
    id: "DF-001",
    order: "ORD-2026-00842",
    product: "Tシャツ ホワイト M",
    sku: "TS-WH-M",
    warehouse: "九州物流センター",
    qty: 2,
    reason: "検品不良（汚れ）",
    route: "返品倉庫",
    source: "manual",
    registeredAt: "2026-04-25 09:24",
    registeredBy: "佐藤 健",
    status: "振替待ち",
  },
  {
    id: "DF-002",
    order: "ORD-2026-00838",
    product: "完全ワイヤレスイヤホン ブラック",
    sku: "TWS-006-BK",
    warehouse: "九州物流センター",
    qty: 1,
    reason: "配送中破損",
    route: "返品倉庫",
    source: "manual",
    registeredAt: "2026-04-24 14:08",
    registeredBy: "鈴木 美咲",
    status: "振替完了",
  },
  {
    id: "DF-003",
    order: "ORD-2026-00835",
    product: "ジャケット ネイビー L",
    sku: "JK-NV-L",
    warehouse: "大阪倉庫",
    qty: 1,
    reason: "色違い納品",
    route: "返品倉庫",
    source: "manual",
    registeredAt: "2026-04-24 11:42",
    registeredBy: "田中 花子",
    status: "承認待ち",
  },
  {
    id: "DF-004",
    order: "ORD-2026-00829",
    product: "ワイヤレスイヤホン Pro ブラック",
    sku: "WEP-001-BK",
    warehouse: "東京本社倉庫",
    qty: 3,
    reason: "充電不良ロット",
    route: "メーカー返却",
    source: "manual",
    registeredAt: "2026-04-23 16:18",
    registeredBy: "高橋 翔",
    status: "振替待ち",
  },
  {
    id: "DF-005",
    order: "ORD-2026-00812",
    product: "USB-Cケーブル 2m",
    sku: "UCB-002",
    warehouse: "大阪倉庫",
    qty: 5,
    reason: "包装破れ",
    route: "アウトレット在庫",
    source: "manual",
    registeredAt: "2026-04-22 10:00",
    registeredBy: "佐藤 健",
    status: "振替完了",
  },
];
