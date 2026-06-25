/**
 * API設定: APIキー / 外部API接続 共有マスタストア
 *
 * 「API設定」画面（src/app/settings/api/page.tsx）で発行・ローテーション・無効化される
 * APIキー一覧と、モール・配送業者の外部接続一覧を画面再読込後も保持する。
 * グローバル設定（レート制限等）は別ストア api-global-settings-store が担当する。
 *
 * 永続化ドメイン:
 * - APIキー   → "api-keys"
 * - 外部接続  → "api-connections"
 * 正規オーナーページは settings/api/page.tsx（このストアを購読する唯一の画面）。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ApiKey {
  id: string;
  label: string;
  scope: string;
  keyMasked: string;
  createdAt: string;
  lastUsed: string;
  enabled: boolean;
  ipWhitelist: string;
  [extra: string]: unknown;
}

export type ApiConnectionAuthType = "api-key" | "oauth" | "basic";
export type ApiConnectionStatus = "ok" | "warning" | "error";

export interface ApiConnection {
  id: string;
  name: string;
  endpoint: string;
  authType: ApiConnectionAuthType;
  status: ApiConnectionStatus;
  lastSync: string;
  [extra: string]: unknown;
}

export const INITIAL_API_KEYS: ApiKey[] = [
  { id: "key-prod", label: "本番（外部連携用）", scope: "受注/在庫/出荷 読取・書込", keyMasked: "sk_live_********************a91f", createdAt: "2025/12/01", lastUsed: "2026/04/30 10:12", enabled: true, ipWhitelist: "203.0.113.10/32" },
  { id: "key-stg", label: "ステージング", scope: "受注 読取のみ", keyMasked: "sk_test_********************42b0", createdAt: "2026/01/15", lastUsed: "2026/04/29 18:00", enabled: true, ipWhitelist: "—" },
  { id: "key-bi", label: "BI（読取専用）", scope: "売上 / 在庫 読取", keyMasked: "sk_read_********************77e3", createdAt: "2026/02/10", lastUsed: "2026/04/30 02:00", enabled: true, ipWhitelist: "10.0.0.0/8" },
  { id: "key-old", label: "旧本番（無効化済）", scope: "受注 読取・書込", keyMasked: "sk_live_********************0011", createdAt: "2024/06/01", lastUsed: "2025/11/30 12:00", enabled: false, ipWhitelist: "—" },
];

export const INITIAL_API_CONNECTIONS: ApiConnection[] = [
  { id: "rakuten", name: "楽天市場 RMS API", endpoint: "https://api.rms.rakuten.co.jp", authType: "oauth", status: "ok", lastSync: "2026/04/30 10:00" },
  { id: "yahoo", name: "Yahoo!ショッピング API", endpoint: "https://circus.shopping.yahooapis.jp", authType: "oauth", status: "ok", lastSync: "2026/04/30 09:50" },
  { id: "amazon", name: "Amazon SP-API", endpoint: "https://sellingpartnerapi-fe.amazon.com", authType: "oauth", status: "warning", lastSync: "2026/04/30 04:00" },
  { id: "yamato", name: "ヤマト B2 クラウド", endpoint: "https://bmypage.kuronekoyamato.co.jp", authType: "api-key", status: "ok", lastSync: "2026/04/30 09:30" },
  { id: "sagawa", name: "佐川急便 e飛伝", endpoint: "https://e-hiden.sagawa-exp.co.jp", authType: "basic", status: "error", lastSync: "2026/04/29 18:00" },
];

/** APIキー一覧の共有ストア（クライアントセッション内で単一インスタンス）。 */
export const apiKeysStore: MasterStore<ApiKey> =
  createMasterStore<ApiKey>(INITIAL_API_KEYS);

/** 外部API接続一覧の共有ストア（クライアントセッション内で単一インスタンス）。 */
export const apiConnectionsStore: MasterStore<ApiConnection> =
  createMasterStore<ApiConnection>(INITIAL_API_CONNECTIONS);
