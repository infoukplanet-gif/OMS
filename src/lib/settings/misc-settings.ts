/**
 * その他システム設定のモジュール内シングルトン。
 *
 * - `settings/misc` ページが書き換える
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）
 */

export interface MiscSettings {
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

export const DEFAULT_MISC_SETTINGS: MiscSettings = {
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

let settings: MiscSettings = { ...DEFAULT_MISC_SETTINGS, toggles: { ...DEFAULT_MISC_SETTINGS.toggles } };

export function getMiscSettings(): MiscSettings {
  return { ...settings, toggles: { ...settings.toggles } };
}

export function setMiscSettings(patch: Partial<MiscSettings>): void {
  settings = {
    ...settings,
    ...patch,
    toggles: patch.toggles ? { ...patch.toggles } : settings.toggles,
  };
}

export function resetMiscSettings(): void {
  settings = { ...DEFAULT_MISC_SETTINGS, toggles: { ...DEFAULT_MISC_SETTINGS.toggles } };
}
