/**
 * API グローバル設定 共有マスタストア（single-config 1-record パターン）。
 *
 * レートリミット / CORS / Webhook / 最大ペイロードサイズを
 * id 固定の 1 レコードとして createMasterStore に載せる。
 *
 * 永続化（domain: "api-global-settings"）の正規オーナーページは
 * src/app/settings/api/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ApiGlobalSettingsFields {
  rateLimit: number;
  allowCors: boolean;
  webhookUrl: string;
  webhookEnabled: boolean;
  maxPayloadMb: number;
}

export interface ApiGlobalSettingsRecord extends ApiGlobalSettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_API_GLOBAL_SETTINGS: ApiGlobalSettingsFields = {
  rateLimit: 60,
  allowCors: false,
  webhookUrl: "https://hooks.example.com/oms/events",
  webhookEnabled: true,
  maxPayloadMb: 10,
};

export const INITIAL_API_GLOBAL_SETTINGS: ApiGlobalSettingsRecord[] = [
  { id: "config", ...DEFAULT_API_GLOBAL_SETTINGS },
];

export const apiGlobalSettingsStore: MasterStore<ApiGlobalSettingsRecord> =
  createMasterStore<ApiGlobalSettingsRecord>(INITIAL_API_GLOBAL_SETTINGS);
