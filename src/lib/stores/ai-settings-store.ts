/**
 * AI設定（BYOAI）共有マスタストア（single-config 1-record パターン）。
 *
 * 各 AI プロバイダの「接続済みフラグ」とエージェント自律度を id 固定の 1 レコードで保持する。
 *
 * ⚠ セキュリティ: API キーの実体はこのストア／スナップショットには絶対に保存しない。
 *   永続化は client→server action 経由でブラウザにも DB にも平文で載るため、
 *   秘密情報は対象外（接続状態のみ）とする。実キー保管はサーバ側暗号化が前提（別途）。
 *   参照: reference_security_audit_v1
 *
 * 永続化（domain: "ai-settings"）の正規オーナーページは
 * src/app/settings/page.tsx（AI設定タブ）。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface AIProviderState {
  name: string;
  models: string;
  connected: boolean;
}

export interface AISettingsRecord {
  id: string;
  providers: AIProviderState[];
  autonomy: string;
  [extra: string]: unknown;
}

export const DEFAULT_AI_PROVIDERS: AIProviderState[] = [
  { name: "OpenAI", models: "GPT-4o, GPT-4o-mini", connected: false },
  { name: "Anthropic", models: "Claude Opus, Claude Sonnet", connected: false },
  { name: "Google", models: "Gemini Pro, Gemini Flash", connected: false },
];

export const DEFAULT_AI_AUTONOMY = "Level 2";

export const INITIAL_AI_SETTINGS: AISettingsRecord[] = [
  {
    id: "config",
    providers: DEFAULT_AI_PROVIDERS.map((p) => ({ ...p })),
    autonomy: DEFAULT_AI_AUTONOMY,
  },
];

export const aiSettingsStore: MasterStore<AISettingsRecord> =
  createMasterStore<AISettingsRecord>(INITIAL_AI_SETTINGS);
