/**
 * 受注取得API 共通設定 共有マスタストア（single-config 1-record パターン）。
 *
 * 各チャネルの個別設定がない場合のデフォルト値（取得間隔・重複検出キー・
 * リトライ・通知先・遡及取得日数）を id 固定の 1 レコードとして保持する。
 * 秘密情報は含まないため平文永続化で問題ない。
 *
 * 永続化（domain: "order-fetch-settings"）の正規オーナーページは
 * src/app/settings/api/order-fetch/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

/**
 * 受注取得API共通設定の具体フィールド（index signature なし）。
 * フォーム側で `keyof` / `Omit` が壊れないよう、index signature を持つ
 * Record とは別に定義する。
 */
export interface OrderFetchSettingsFields {
  defaultInterval: string;
  dedupKey: string;
  retryMax: string;
  retryInterval: string;
  notifyEmail: string;
  lookbackDays: string;
}

export interface OrderFetchSettingsRecord extends OrderFetchSettingsFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_ORDER_FETCH_SETTINGS: OrderFetchSettingsFields = {
  defaultInterval: "15分",
  dedupKey: "受注番号＋モール",
  retryMax: "3",
  retryInterval: "5",
  notifyEmail: "admin@example.com",
  lookbackDays: "7",
};

export const INITIAL_ORDER_FETCH_SETTINGS: OrderFetchSettingsRecord[] = [
  { id: "config", ...DEFAULT_ORDER_FETCH_SETTINGS },
];

export const orderFetchSettingsStore: MasterStore<OrderFetchSettingsRecord> =
  createMasterStore<OrderFetchSettingsRecord>(INITIAL_ORDER_FETCH_SETTINGS);
