/**
 * 企業設定 共有マスタストア（single-config 1-record パターン）。
 *
 * 企業の基本情報・ロゴ名・システム設定（タイムゾーン/通貨/税率/税計算）を
 * id 固定の 1 レコードとして createMasterStore に載せる。
 *
 * 永続化（domain: "company-settings"）の正規オーナーページは
 * src/app/settings/page.tsx（企業設定タブ）。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/**
 * 企業設定の具体フィールド（index signature なし）。
 * フォーム側で `keyof` / `Omit` が壊れないよう、index signature を持つ
 * Record とは別に定義する。
 */
export interface CompanySettingsFields {
  name: string;
  code: string;
  representative: string;
  tel: string;
  zip: string;
  fax: string;
  address: string;
  email: string;
  logoName: string;
  timezone: string;
  currency: string;
  taxRate: string;
  taxMode: "included" | "excluded";
}

export interface CompanySettingsRecord extends CompanySettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettingsFields = {
  name: "株式会社サンプル",
  code: "SAMPLE-001",
  representative: "",
  tel: "",
  zip: "",
  fax: "",
  address: "",
  email: "",
  logoName: "",
  timezone: "Asia/Tokyo",
  currency: "JPY - 日本円",
  taxRate: "10%",
  taxMode: "included",
};

export const INITIAL_COMPANY_SETTINGS: CompanySettingsRecord[] = [
  { id: "config", ...DEFAULT_COMPANY_SETTINGS },
];

export const companySettingsStore: MasterStore<CompanySettingsRecord> =
  createMasterStore<CompanySettingsRecord>(INITIAL_COMPANY_SETTINGS);
