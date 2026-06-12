/**
 * API設定のモジュール内シングルトン。
 *
 * - `settings/api` ページが書き換える
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）
 */

export interface ApiGlobalSettings {
  rateLimit: number;
  allowCors: boolean;
  webhookUrl: string;
  webhookEnabled: boolean;
  maxPayloadMb: number;
}

export const DEFAULT_API_GLOBAL: ApiGlobalSettings = {
  rateLimit: 60,
  allowCors: false,
  webhookUrl: "https://hooks.example.com/oms/events",
  webhookEnabled: true,
  maxPayloadMb: 10,
};

let apiGlobal: ApiGlobalSettings = { ...DEFAULT_API_GLOBAL };

export function getApiGlobalSettings(): ApiGlobalSettings {
  return { ...apiGlobal };
}

export function setApiGlobalSettings(patch: Partial<ApiGlobalSettings>): void {
  apiGlobal = { ...apiGlobal, ...patch };
}

export function resetApiGlobalSettings(): void {
  apiGlobal = { ...DEFAULT_API_GLOBAL };
}
