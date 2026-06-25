/**
 * 拠点と店舗の在庫連携設定 共有マスタストア（collection パターン）。
 *
 * products/inventory/warehouse-link ページの連携行（店舗×拠点×優先度×配分比率×
 * 欠品閾値×自動引当×有効フラグ）を id をキーにした複数レコードとして
 * createMasterStore に載せ、追加/編集/削除をリロード後も復元する。
 *
 * 永続化（domain: "product-warehouse-link-settings"）の正規オーナーページは
 * src/app/products/inventory/warehouse-link/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface WarehouseLinkRecord {
  id: string;
  shop: string;
  warehouse: string;
  priority: number;
  ratio: number;
  enabled: boolean;
  lowStockThreshold: number;
  autoReserve: boolean;
  [extra: string]: unknown;
}

export const INITIAL_WAREHOUSE_LINK: WarehouseLinkRecord[] = [
  { id: "1", shop: "rakuten", warehouse: "main", priority: 1, ratio: 70, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: "2", shop: "rakuten", warehouse: "osaka", priority: 2, ratio: 30, enabled: true, lowStockThreshold: 3, autoReserve: true },
  { id: "3", shop: "yahoo", warehouse: "main", priority: 1, ratio: 100, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: "4", shop: "amazon", warehouse: "fulfillment", priority: 1, ratio: 100, enabled: true, lowStockThreshold: 10, autoReserve: false },
  { id: "5", shop: "shopify", warehouse: "main", priority: 1, ratio: 50, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: "6", shop: "shopify", warehouse: "3pl_tokyo", priority: 2, ratio: 50, enabled: false, lowStockThreshold: 5, autoReserve: false },
];

export const warehouseLinkStore: MasterStore<WarehouseLinkRecord> =
  createMasterStore<WarehouseLinkRecord>(INITIAL_WAREHOUSE_LINK);
