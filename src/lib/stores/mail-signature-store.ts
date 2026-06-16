/**
 * メール署名 共有マスタストア。
 *
 * 用途別の署名テンプレート（名前・本文・既定フラグ）を id をキーに保持する。
 * 本文はテンプレ文字列のみで秘密情報を含まないため平文永続化で問題ない。
 *
 * 永続化（domain: "mail-signatures"）の正規オーナーページは
 * src/app/mail/signature/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailSignatureRecord {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_SIGNATURES: MailSignatureRecord[] = [
  {
    id: "sig-default",
    name: "通常用署名",
    isDefault: true,
    body: `--
OMSショップ カスタマーサポート
〒100-0001 東京都千代田区千代田1-1-1
TEL: 03-1234-5678 / FAX: 03-1234-5679
営業時間: 平日 09:00-18:00
URL: https://example.com/`,
  },
  {
    id: "sig-vip",
    name: "VIP顧客用",
    isDefault: false,
    body: `--
OMSショップ プレミアムサポート 山田 太郎
専用ダイヤル: 03-1234-9999（24時間対応）
URL: https://vip.example.com/`,
  },
  {
    id: "sig-newsletter",
    name: "メルマガ用（配信解除リンク付き）",
    isDefault: false,
    body: `--
OMSショップ お得情報配信
配信解除をご希望の方はこちら: {{unsubscribe_url}}
URL: https://example.com/news`,
  },
];

export const mailSignatureStore: MasterStore<MailSignatureRecord> =
  createMasterStore<MailSignatureRecord>(INITIAL_MAIL_SIGNATURES);
