/**
 * 受注番号採番設定 共有マスタストア
 *
 * 「id 固定の1レコード配列」として createMasterStore に載せる。
 * 永続化（domain: "order-numbering"）の正規オーナーページは
 * src/app/orders/numbering/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export type ResetCycle = "never" | "daily" | "monthly" | "yearly";
export type DateFormat = "none" | "yyyymmdd" | "yymmdd" | "yymm" | "yy";

export interface OrderNumberingConfig {
  id: string;
  prefix: string;
  dateFormat: DateFormat;
  digits: number;
  resetCycle: ResetCycle;
  startNumber: number;
  includeSeparator: boolean;
  [extra: string]: unknown;
}

export const INITIAL_ORDER_NUMBERING: OrderNumberingConfig[] = [
  {
    id: "config",
    prefix: "ORD",
    dateFormat: "yyyymmdd",
    digits: 5,
    resetCycle: "daily",
    startNumber: 1,
    includeSeparator: true,
  },
];

export const orderNumberingStore: MasterStore<OrderNumberingConfig> =
  createMasterStore<OrderNumberingConfig>(INITIAL_ORDER_NUMBERING);
