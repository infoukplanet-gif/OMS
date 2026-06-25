/**
 * Yahoo!ロジ連携設定 共有マスタストア（single-config 1-record パターン）。
 *
 * warehouse-integration/yahoo-logi ページが編集する接続情報（Yahoo!ショップID/
 * パートナーコード/アクセストークン/在庫同期間隔/出荷指示送信タイミング）と
 * 連携機能トグル（出荷指示送信/在庫数同期/返品入荷取込）を id 固定の 1 レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "warehouse-yahoo-logi-settings"）の正規オーナーページは
 * src/app/warehouse-integration/yahoo-logi/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface WarehouseYahooLogiFields {
  storeId: string;
  partnerCode: string;
  token: string;
  syncInterval: string;
  shipTiming: string;
  autoShip: boolean;
  syncStock: boolean;
  autoReturn: boolean;
}

export interface WarehouseYahooLogiRecord extends WarehouseYahooLogiFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_WAREHOUSE_YAHOO_LOGI: WarehouseYahooLogiFields = {
  storeId: "oms-yshop",
  partnerCode: "YL-2026-00845",
  token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  syncInterval: "15分",
  shipTiming: "受注確定後即時",
  autoShip: true,
  syncStock: true,
  autoReturn: true,
};

export const INITIAL_WAREHOUSE_YAHOO_LOGI: WarehouseYahooLogiRecord[] = [
  { id: "config", ...DEFAULT_WAREHOUSE_YAHOO_LOGI },
];

export const warehouseYahooLogiStore: MasterStore<WarehouseYahooLogiRecord> =
  createMasterStore<WarehouseYahooLogiRecord>(INITIAL_WAREHOUSE_YAHOO_LOGI);
