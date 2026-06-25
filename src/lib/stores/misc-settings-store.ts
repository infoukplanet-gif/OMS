/**
 * その他システム設定 共有マスタストア（single-config 1-record パターン）。
 *
 * セッション・表示・バックアップ・サポート連絡先などの全般設定を
 * id 固定の 1 レコードとして createMasterStore に載せる。
 *
 * 永続化（domain: "misc-settings"）の正規オーナーページは
 * src/app/settings/misc/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/**
 * その他システム設定の具体フィールド（index signature なし）。
 * フォーム側で `keyof` / `Omit` が壊れないよう、index signature を持つ
 * Record とは別に定義する。
 */
export interface MiscSettingsFields {
  // システム動作トグル
  toggles: Record<string, boolean>;
  // 表示設定
  pageSize: string;
  sort: string;
  thousands: string;
  dateFormat: string;
  timezone: string;
  language: string;
  currency: string;
  theme: string;
  // バックアップ
  backupTime: string;
  orderRetention: string;
  logRetention: string;
  purgeDays: string;
  backupTarget: string;
  // 連絡先
  adminEmail: string;
  supportTel: string;
  emergency: string;
  companyCode: string;
}

export interface MiscSettingsRecord extends MiscSettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_MISC_SETTINGS: MiscSettingsFields = {
  toggles: {
    session: true,
    audit: true,
    maintenance: false,
    desktop: true,
    twoFactor: false,
    ipRestrict: false,
    darkmode: true,
    anaytics: true,
  },
  pageSize: "50",
  sort: "受注日降順",
  thousands: "3桁カンマ区切り",
  dateFormat: "YYYY-MM-DD HH:mm",
  timezone: "Asia/Tokyo (JST)",
  language: "日本語",
  currency: "JPY (¥)",
  theme: "Liquid Glass（標準）",
  backupTime: "03:00",
  orderRetention: "5",
  logRetention: "1",
  purgeDays: "30",
  backupTarget: "AWS S3 (s3://oms-backup/daily)",
  adminEmail: "admin@example.com",
  supportTel: "03-0000-0000",
  emergency: "emergency@example.com",
  companyCode: "OMS-COMPANY-001",
};

export const INITIAL_MISC_SETTINGS: MiscSettingsRecord[] = [
  { id: "config", ...DEFAULT_MISC_SETTINGS },
];

export const miscSettingsStore: MasterStore<MiscSettingsRecord> =
  createMasterStore<MiscSettingsRecord>(INITIAL_MISC_SETTINGS);
