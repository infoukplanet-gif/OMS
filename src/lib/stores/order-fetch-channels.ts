/**
 * 受注取得APIチャネル一覧 共有ストア（collection パターン）。
 *
 * 各モール受注取得APIチャネル（楽天・Yahoo!・Amazon・Shopify等）の
 * 有効/無効フラグ・最終実行時刻・取得件数・エラー件数・認証期限を
 * id をキーにした複数レコードとして createMasterStore に載せ、
 * チャネル有効/無効切替・手動実行・全チャネル実行をリロード後も復元する。
 *
 * チャネルステータス（ok/warning/error/disabled）はライフサイクルではなく
 * 単純なフラグ切替なので state-machine は使わない。
 *
 * 永続化（domain: "order-fetch-channels"）の正規オーナーページは
 * src/app/settings/api/order-fetch/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_ORDER_FETCH_CHANNELS } from "../seeds/order-fetch-channels";

export interface OrderFetchChannelRecord {
  id: string;
  name: string;
  endpoint: string;
  schedule: string;
  lastRun: string;
  lastCount: number;
  total24h: number;
  errorCount: number;
  status: "ok" | "warning" | "error" | "disabled";
  shop: string;
  authExpires: string;
  [extra: string]: unknown;
}

export const orderFetchChannelStore: MasterStore<OrderFetchChannelRecord> =
  createMasterStore<OrderFetchChannelRecord>(INITIAL_ORDER_FETCH_CHANNELS);
