/**
 * 送信失敗時の自動リトライ設定 共有マスタストア（single-config 1-record パターン）。
 *
 * mail/pending ページの「自動リトライ設定」（リトライ間隔・最大回数・通知先）を
 * id 固定の 1 レコードとして createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "mail-retry-settings"）の正規オーナーページは
 * src/app/mail/pending/page.tsx。送信待ちキュー自体は mailStore（mail/page.tsx がオーナー）
 * が保持し、本ストアは「リトライ制御パラメータの永続化」だけを担当する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailRetrySettingsFields {
  /** リトライ間隔（分）。 */
  retryInterval: number;
  /** 最大リトライ回数。 */
  retryMaxCount: number;
  /** 最大失敗時の通知先メールアドレス。 */
  notifyEmail: string;
}

export interface MailRetrySettingsRecord extends MailRetrySettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_MAIL_RETRY_SETTINGS: MailRetrySettingsFields = {
  retryInterval: 30,
  retryMaxCount: 3,
  notifyEmail: "ops@example.com",
};

export const INITIAL_MAIL_RETRY_SETTINGS: MailRetrySettingsRecord[] = [
  { id: "config", ...DEFAULT_MAIL_RETRY_SETTINGS },
];

export const mailRetrySettingsStore: MasterStore<MailRetrySettingsRecord> =
  createMasterStore<MailRetrySettingsRecord>(INITIAL_MAIL_RETRY_SETTINGS);
