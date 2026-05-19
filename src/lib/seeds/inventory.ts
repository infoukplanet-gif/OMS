/**
 * inventoryStore の初期シード値。
 *
 * v1 のクライアントセッション内ストアを画面横断で共有する際、
 * 最初にマウントされたページが空ストアにセットする初期データ。
 * products/inventory/page と purchasing/page の両方から import される。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { InventoryRecord } from "@/lib/state-machines/inventory";

export const INITIAL_INVENTORY: InventoryRecord[] = [
  { sku: "WEP-001-BK", warehouse: "東京本社倉庫",     onHand: 30,  allocated: 5,  constant: 10, reorder: 15, lot: 10 },
  { sku: "WEP-001-WH", warehouse: "東京本社倉庫",     onHand: 15,  allocated: 3,  constant: 10, reorder: 15, lot: 10 },
  { sku: "UCB-002",    warehouse: "大阪倉庫",         onHand: 8,   allocated: 2,  constant: 20, reorder: 25, lot: 50 },
  { sku: "MBT-004",    warehouse: "東京本社倉庫",     onHand: 2,   allocated: 1,  constant: 15, reorder: 20, lot: 30 },
  { sku: "TWS-006-BK", warehouse: "九州物流センター", onHand: 0,   allocated: 0,  constant: 10, reorder: 10, lot: 20 },
  { sku: "CHG-007",    warehouse: "東京本社倉庫",     onHand: 67,  allocated: 8,  constant: 30, reorder: 40, lot: 50 },
  { sku: "PFS-005",    warehouse: "東京本社倉庫",     onHand: 482, allocated: 12, constant: 50, reorder: 80, lot: 100 },
  { sku: "TS-WH-M",    warehouse: "九州物流センター", onHand: 30,  allocated: 4,  constant: 20, reorder: 30, lot: 50 },
  { sku: "JK-NV-L",    warehouse: "大阪倉庫",         onHand: 5,   allocated: 1,  constant: 15, reorder: 20, lot: 25 },
];

/**
 * 表示用の商品名マスタ（InventoryRecord に商品名はないため UI 層で補完）。
 */
export const SKU_NAMES: Record<string, string> = {
  "WEP-001-BK": "ワイヤレスイヤホン Pro / ブラック",
  "WEP-001-WH": "ワイヤレスイヤホン Pro / ホワイト",
  "UCB-002":    "USB-Cケーブル 2m",
  "MBT-004":    "モバイルバッテリー 20000mAh",
  "TWS-006-BK": "完全ワイヤレスイヤホン / ブラック",
  "CHG-007":    "急速充電器 65W",
  "PFS-005":    "保護フィルム セット",
  "TS-WH-M":    "Tシャツ ホワイト M",
  "JK-NV-L":    "ジャケット ネイビー L",
};
