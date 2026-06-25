/**
 * 顧客マスタ自動作成設定 共有マスタストア（single-config 1-record パターン）。
 *
 * customers/auto-create ページの設定（関連自動実行処理の状態 / 重複判定ルール /
 * 重複時の動作 / 既定ランク / 取得元別ルール）を id 固定の 1 レコードに束ね、
 * リロード後も復元する。実行履歴（logs）はモック表示用なので永続化対象外。
 *
 * 永続化（domain: "customer-auto-create-settings"）の正規オーナーページは
 * src/app/customers/auto-create/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type ProcessStatus = "running" | "stopped";
export type DuplicateAction = "merge" | "skip" | "create";

export interface ProcessState {
  id: string;
  status: ProcessStatus;
}

export interface SourceRuleState {
  source: string;
  enabled: boolean;
}

export interface CustomerAutoCreateFields {
  /** 関連自動実行処理の id -> 状態。 */
  processStatus: Record<string, ProcessStatus>;
  /** 取得元 -> 有効フラグ。 */
  sourceEnabled: Record<string, boolean>;
  emailDup: boolean;
  phoneDup: boolean;
  nameAddrDup: boolean;
  logEnabled: boolean;
  duplicateAction: DuplicateAction;
  defaultRank: string;
}

export interface CustomerAutoCreateRecord extends CustomerAutoCreateFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_CUSTOMER_AUTO_CREATE: CustomerAutoCreateFields = {
  processStatus: {
    "customer-create": "running",
    "duplicate-merge": "running",
    "rank-update": "running",
    "duplicate-notify": "stopped",
    "blacklist-check": "running",
    "wholesale-suggest": "stopped",
  },
  sourceEnabled: {
    楽天市場: true,
    "Yahoo!ショッピング": true,
    Amazon: true,
    "自社EC（Shopify）": true,
    メール受注: false,
    卸先EDI: true,
  },
  emailDup: true,
  phoneDup: true,
  nameAddrDup: false,
  logEnabled: true,
  duplicateAction: "merge",
  defaultRank: "一般",
};

export const INITIAL_CUSTOMER_AUTO_CREATE: CustomerAutoCreateRecord[] = [
  { id: "config", ...DEFAULT_CUSTOMER_AUTO_CREATE },
];

export const customerAutoCreateStore: MasterStore<CustomerAutoCreateRecord> =
  createMasterStore<CustomerAutoCreateRecord>(INITIAL_CUSTOMER_AUTO_CREATE);
