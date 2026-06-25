/**
 * ロジザード ZERO 連携設定 共有マスタストア（single-config 1-record パターン）。
 *
 * warehouse-integration/logizard ページが編集する接続情報（APIホスト/APIキー/
 * 会社コード/センターコード/同期間隔/通知メール）と連携機能トグル（出荷指示送信/
 * 在庫数取得/入荷登録/返品入荷取込）を id 固定の 1 レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "warehouse-logizard-settings"）の正規オーナーページは
 * src/app/warehouse-integration/logizard/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface WarehouseLogizardFields {
  host: string;
  apiKey: string;
  companyCode: string;
  centerCode: string;
  syncInterval: string;
  notifyEmail: string;
  autoShip: boolean;
  autoStock: boolean;
  autoInbound: boolean;
  autoReturn: boolean;
}

export interface WarehouseLogizardRecord extends WarehouseLogizardFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_WAREHOUSE_LOGIZARD: WarehouseLogizardFields = {
  host: "https://api.logizard-zero.com",
  apiKey: "lzd_xxxx_yyyyyyyyyyyyyyyy",
  companyCode: "OMS-CORP-0001",
  centerCode: "CENTER-TKY-001",
  syncInterval: "15分",
  notifyEmail: "ops@example.com",
  autoShip: true,
  autoStock: true,
  autoInbound: true,
  autoReturn: false,
};

export const INITIAL_WAREHOUSE_LOGIZARD: WarehouseLogizardRecord[] = [
  { id: "config", ...DEFAULT_WAREHOUSE_LOGIZARD },
];

export const warehouseLogizardStore: MasterStore<WarehouseLogizardRecord> =
  createMasterStore<WarehouseLogizardRecord>(INITIAL_WAREHOUSE_LOGIZARD);
