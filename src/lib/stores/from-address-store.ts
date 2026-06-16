/**
 * 送信元アドレス 共有マスタストア。
 *
 * メール送信元（店舗別の From / Reply-To / 表示名 / 紐付け店舗 / SPF・DKIM 認証状態）を
 * id をキーに保持する。秘密情報は含まないため平文永続化で問題ない。
 *
 * 永続化（domain: "from-addresses"）の正規オーナーページは
 * src/app/mail/signature/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type AuthStatus = "ok" | "warning" | "error";

export interface FromAddressRecord {
  id: string;
  label: string;
  email: string;
  displayName: string;
  replyTo: string;
  isDefault: boolean;
  shop: string;
  spf: AuthStatus;
  dkim: AuthStatus;
  [extra: string]: unknown;
}

export const INITIAL_FROM_ADDRESSES: FromAddressRecord[] = [
  { id: "addr-main", label: "メイン店舗", email: "info@example.com", displayName: "OMSショップ", replyTo: "info@example.com", isDefault: true, shop: "本店", spf: "ok", dkim: "ok" },
  { id: "addr-rakuten", label: "楽天店", email: "rakuten@example.com", displayName: "OMSショップ 楽天市場店", replyTo: "rakuten@example.com", isDefault: false, shop: "楽天店", spf: "ok", dkim: "ok" },
  { id: "addr-yahoo", label: "Yahoo!店", email: "yahoo@example.com", displayName: "OMSショップ Yahoo!ショッピング店", replyTo: "yahoo@example.com", isDefault: false, shop: "Yahoo!店", spf: "ok", dkim: "warning" },
  { id: "addr-amazon", label: "Amazon店", email: "amazon@example.com", displayName: "OMSショップ Amazon店", replyTo: "amazon@example.com", isDefault: false, shop: "Amazon店", spf: "warning", dkim: "ok" },
];

export const fromAddressStore: MasterStore<FromAddressRecord> =
  createMasterStore<FromAddressRecord>(INITIAL_FROM_ADDRESSES);
