/**
 * 自動実行処理（バッチジョブ）設定 共有マスタストア（single-config 1-record パターン）。
 *
 * settings/automation ページの 8 ジョブの有効/無効フラグを id 固定の 1 レコードとして
 * createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "automation-jobs"）の正規オーナーページは
 * src/app/settings/automation/page.tsx。
 *
 * 「mail-compose」トグルが auto-settings シングルトンへ波及する cross-effect は
 * 従来どおりページ側の runtime ブリッジが担当し、auto-mail-settings ストアの
 * 二重オーナー（二重 snapshot）にはしない。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/** 自動実行ジョブのキー。 */
export type AutomationKey =
  | "allocate"
  | "mail-compose"
  | "mail-send"
  | "inventory-sync"
  | "product-autocreate"
  | "np-connect"
  | "order-fetch"
  | "customer-autocreate";

/** ジョブの既定有効状態（INITIAL の enabled を踏襲）。 */
const DEFAULT_ENABLED: Record<AutomationKey, boolean> = {
  allocate: true,
  "mail-compose": true,
  "mail-send": true,
  "inventory-sync": true,
  "product-autocreate": false,
  "np-connect": false,
  "order-fetch": true,
  "customer-autocreate": false,
};

export interface AutomationJobsFields {
  /** ジョブキー -> 有効フラグ。 */
  enabled: Record<string, boolean>;
}

export interface AutomationJobsRecord extends AutomationJobsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_AUTOMATION_JOBS: AutomationJobsFields = {
  enabled: { ...DEFAULT_ENABLED },
};

export const INITIAL_AUTOMATION_JOBS: AutomationJobsRecord[] = [
  { id: "config", ...DEFAULT_AUTOMATION_JOBS },
];

export const automationJobsStore: MasterStore<AutomationJobsRecord> =
  createMasterStore<AutomationJobsRecord>(INITIAL_AUTOMATION_JOBS);
