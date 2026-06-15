/**
 * 受注確定ルール設定 共有マスタストア
 *
 * 「id 固定の1レコード配列」として createMasterStore に載せる。
 * 永続化（domain: "order-confirm-rules"）の正規オーナーページは
 * src/app/orders/confirm-settings/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface OrderConfirmRulesConfig {
  id: string;
  paymentUnset: boolean;
  amountLimit: boolean;
  amountLimitValue: number;
  addressInvalid: boolean;
  blacklistCustomer: boolean;
  duplicateSameDay: boolean;
  noteFilled: boolean;
  outOfStock: boolean;
  firstTimeCustomer: boolean;
  [extra: string]: unknown;
}

export const INITIAL_ORDER_CONFIRM_RULES: OrderConfirmRulesConfig[] = [
  {
    id: "config",
    paymentUnset: true,
    amountLimit: true,
    amountLimitValue: 100000,
    addressInvalid: true,
    blacklistCustomer: true,
    duplicateSameDay: false,
    noteFilled: false,
    outOfStock: true,
    firstTimeCustomer: false,
  },
];

export const orderConfirmRulesStore: MasterStore<OrderConfirmRulesConfig> =
  createMasterStore<OrderConfirmRulesConfig>(INITIAL_ORDER_CONFIRM_RULES);
