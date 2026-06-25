/**
 * メールサーバ（SMTP）設定 共有マスタストア（collection パターン）。
 *
 * mail/server ページの送信サーバ一覧（メイン/フォールバック/メルマガ専用など）を
 * id をキーにした複数レコードで保持し、リロード後も復元する。
 * 追加=upsert / 削除=remove / 編集=upsert。
 *
 * 永続化（domain: "mail-server-settings"）の正規オーナーページは
 * src/app/mail/server/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailServerRecord {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: "none" | "ssl" | "tls";
  fromAddress: string;
  fromName: string;
  isPrimary: boolean;
  status: "ok" | "warning" | "error";
  lastChecked: string;
  daily: number;
  monthly: number;
  /** モックマスク値のみ保持（実秘密情報は扱わない）。 */
  password: string;
  timeoutSec: number;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_SERVERS: MailServerRecord[] = [
  {
    id: "smtp-primary",
    name: "メイン送信サーバ（SendGrid）",
    host: "smtp.sendgrid.net",
    port: 587,
    username: "apikey",
    encryption: "tls",
    fromAddress: "info@example.com",
    fromName: "OMSショップ",
    isPrimary: true,
    status: "ok",
    lastChecked: "2026/04/30 09:30",
    daily: 8240,
    monthly: 124530,
    password: "********",
    timeoutSec: 30,
  },
  {
    id: "smtp-fallback",
    name: "フォールバック（Amazon SES）",
    host: "email-smtp.ap-northeast-1.amazonaws.com",
    port: 587,
    username: "AKIAxxxxxxxxxxxx",
    encryption: "tls",
    fromAddress: "info@example.com",
    fromName: "OMSショップ",
    isPrimary: false,
    status: "ok",
    lastChecked: "2026/04/30 08:00",
    daily: 0,
    monthly: 1230,
    password: "********",
    timeoutSec: 30,
  },
  {
    id: "smtp-newsletter",
    name: "メルマガ専用（Postmark）",
    host: "smtp.postmarkapp.com",
    port: 587,
    username: "postmark-token",
    encryption: "tls",
    fromAddress: "newsletter@example.com",
    fromName: "OMSショップ お得情報",
    isPrimary: false,
    status: "warning",
    lastChecked: "2026/04/29 22:00",
    daily: 0,
    monthly: 5400,
    password: "********",
    timeoutSec: 30,
  },
];

export const mailServerStore: MasterStore<MailServerRecord> =
  createMasterStore<MailServerRecord>(INITIAL_MAIL_SERVERS);
