/**
 * 在庫振り分け設定 共有ストア
 *
 * チャネル別配分比率・欠品設定・同期設定を画面横断で共有する。
 * 全設定を id: "config" の 1 レコードにまとめる単一設定型。
 *
 * - クライアントセッション内で生存（リロードで初期シードに戻る）
 * - 永続化（domain: "channel-allocation"）の正規オーナーページは
 *   src/app/products/allocation/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ChannelAlloc {
  key: string;
  label: string;
  ratio: number;
  reservedUnits: number;
  enabled: boolean;
  overSellAllowed: boolean;
}

export interface ChannelAllocationConfig {
  id: string;
  channels: ChannelAlloc[];
  syncInterval: string;
  applyScope: string;
  lowStockAction: string;
  lowStockThreshold: number;
  autoRedistribute: boolean;
  priorityOnShortage: string;
  [extra: string]: unknown;
}

export const INITIAL_CHANNEL_ALLOCATION: ChannelAllocationConfig[] = [
  {
    id: "config",
    channels: [
      { key: "rakuten", label: "楽天市場", ratio: 35, reservedUnits: 3, enabled: true, overSellAllowed: false },
      { key: "yahoo", label: "Yahoo!ショッピング", ratio: 15, reservedUnits: 2, enabled: true, overSellAllowed: false },
      { key: "amazon", label: "Amazon", ratio: 25, reservedUnits: 5, enabled: true, overSellAllowed: false },
      { key: "shopify", label: "自社Shopify", ratio: 15, reservedUnits: 2, enabled: true, overSellAllowed: true },
      { key: "base", label: "BASE", ratio: 5, reservedUnits: 1, enabled: true, overSellAllowed: false },
      { key: "wholesale", label: "卸販売", ratio: 5, reservedUnits: 0, enabled: true, overSellAllowed: false },
    ],
    syncInterval: "5",
    applyScope: "all",
    lowStockAction: "pause",
    lowStockThreshold: 3,
    autoRedistribute: true,
    priorityOnShortage: "自社Shopify",
  },
];

/** クライアントセッション内で共有される単一の ChannelAllocationStore インスタンス */
export const channelAllocationStore: MasterStore<ChannelAllocationConfig> =
  createMasterStore<ChannelAllocationConfig>(INITIAL_CHANNEL_ALLOCATION);
