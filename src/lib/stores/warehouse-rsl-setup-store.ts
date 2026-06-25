/**
 * RSL 初期登録 / SKUマッピング 共有マスタストア（collection + config 混在パターン）。
 *
 * warehouse-integration/rakuten-super-logi/setup ページが扱う2種類のデータを
 * 単一ドメイン "warehouse-rsl-setup-settings" にまとめて永続化する:
 *  - 基本登録情報（企業ID・倉庫ID・契約種別）: id 固定の 1 レコード（CONFIG_ID）。
 *  - SKUマッピング一覧（OMS商品コード ⇔ RSL SKU）: id をキーにした複数レコード。
 *
 * いずれも createMasterStore に同居させ、ページ側で CONFIG_ID レコードを
 * フィルタして一覧と設定を分離する。追加/更新は upsert、削除は remove。
 *
 * 永続化の正規オーナーページは
 * src/app/warehouse-integration/rakuten-super-logi/setup/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/** 基本登録情報レコードの固定 id（一覧の SKU レコードと区別する）。 */
export const RSL_SETUP_CONFIG_ID = "__config__";

export type RslSkuStatus = "登録済" | "申請中" | "未登録" | "保留";

export interface RslSetupConfig {
  companyId: string;
  warehouseId: string;
  contractType: string;
}

export interface RslSetupConfigRecord extends RslSetupConfig {
  id: typeof RSL_SETUP_CONFIG_ID;
  kind: "config";
  [extra: string]: unknown;
}

export interface RslSkuMapRecord {
  id: string;
  kind: "sku";
  omsCode: string;
  omsName: string;
  rslSku: string;
  rslName: string;
  upc: string;
  status: RslSkuStatus;
  registeredAt: string;
  [extra: string]: unknown;
}

export type RslSetupRecord = RslSetupConfigRecord | RslSkuMapRecord;

export const DEFAULT_RSL_SETUP_CONFIG: RslSetupConfig = {
  companyId: "RAK-OMS-CORP-0042",
  warehouseId: "RSL-CHIBA-A",
  contractType: "通常契約",
};

const INITIAL_CONFIG_RECORD: RslSetupConfigRecord = {
  id: RSL_SETUP_CONFIG_ID,
  kind: "config",
  ...DEFAULT_RSL_SETUP_CONFIG,
};

const INITIAL_SKU_RECORDS: RslSkuMapRecord[] = [
  { id: "1", kind: "sku", omsCode: "P-001", omsName: "コットンTシャツ ホワイト M", rslSku: "RSL-OMS-001-WH-M", rslName: "Cotton Tee White M", upc: "4901234567890", status: "登録済", registeredAt: "2026/01/15" },
  { id: "2", kind: "sku", omsCode: "P-001-L", omsName: "コットンTシャツ ホワイト L", rslSku: "RSL-OMS-001-WH-L", rslName: "Cotton Tee White L", upc: "4901234567891", status: "登録済", registeredAt: "2026/01/15" },
  { id: "3", kind: "sku", omsCode: "P-002", omsName: "デニムジャケット M", rslSku: "RSL-OMS-002-DM-M", rslName: "Denim Jacket M", upc: "4901234567892", status: "登録済", registeredAt: "2026/02/01" },
  { id: "4", kind: "sku", omsCode: "P-003", omsName: "ステンレスタンブラー 350ml", rslSku: "RSL-OMS-003-350", rslName: "SS Tumbler 350ml", upc: "4901234567893", status: "登録済", registeredAt: "2026/02/15" },
  { id: "5", kind: "sku", omsCode: "P-099", omsName: "新商品テスト", rslSku: "—", rslName: "—", upc: "—", status: "未登録", registeredAt: "—" },
  { id: "6", kind: "sku", omsCode: "P-008", omsName: "ストーンウェアマグ", rslSku: "RSL-OMS-008", rslName: "Stoneware Mug", upc: "4901234567898", status: "申請中", registeredAt: "2026/04/28" },
  { id: "7", kind: "sku", omsCode: "P-100", omsName: "リネンエプロン グリーン", rslSku: "—", rslName: "—", upc: "—", status: "保留", registeredAt: "—" },
];

export const INITIAL_RSL_SETUP: RslSetupRecord[] = [
  INITIAL_CONFIG_RECORD,
  ...INITIAL_SKU_RECORDS,
];

export const rslSetupStore: MasterStore<RslSetupRecord> =
  createMasterStore<RslSetupRecord>(INITIAL_RSL_SETUP);
