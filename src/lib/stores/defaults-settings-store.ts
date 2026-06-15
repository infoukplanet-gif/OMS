/**
 * 既定値（デフォルト）設定 共有マスタストア
 *
 * 受注・商品・顧客・発注の各フォームの初期表示値を「id 固定の1レコード配列」として
 * createMasterStore に載せる（single-config 1-record パターン）。
 *
 * 永続化（domain: "defaults-settings"）の正規オーナーページは
 * src/app/settings/defaults/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface DefaultsSettingsRecord {
  id: string;
  order: Record<string, string>;
  product: Record<string, string>;
  customer: Record<string, string>;
  purchase: Record<string, string>;
  [extra: string]: unknown;
}

interface DefaultsSettingsValues {
  order: Record<string, string>;
  product: Record<string, string>;
  customer: Record<string, string>;
  purchase: Record<string, string>;
}

/** 受注・商品・顧客・発注フォームの既定初期値。 */
export const DEFAULT_DEFAULTS_SETTINGS: DefaultsSettingsValues = {
  order: {
    shop: "本店",
    warehouse: "東京本社倉庫",
    kbn: "一般",
    payment: "クレジットカード",
    shipping: "ヤマト運輸",
    shipMethod: "通常",
    tax: "10%",
    shippingFee: "880",
  },
  product: {
    sales: "通常販売",
    taxKbn: "内税",
    stockWh: "東京本社倉庫",
    stockManage: "管理する",
    leadtime: "1",
    minStock: "10",
    category: "未分類",
  },
  customer: {
    type: "一般顧客",
    term: "先払い",
    closing: "月末",
    paymentSite: "翌月末",
    credit: "100000",
    rank: "未設定",
  },
  purchase: {
    supplier: "未設定",
    currency: "JPY",
    deliveryTerms: "国内倉庫納入",
    leadtime: "14",
  },
};

export const INITIAL_DEFAULTS_SETTINGS: DefaultsSettingsRecord[] = [
  {
    id: "config",
    order: { ...DEFAULT_DEFAULTS_SETTINGS.order },
    product: { ...DEFAULT_DEFAULTS_SETTINGS.product },
    customer: { ...DEFAULT_DEFAULTS_SETTINGS.customer },
    purchase: { ...DEFAULT_DEFAULTS_SETTINGS.purchase },
  },
];

export const defaultsSettingsStore: MasterStore<DefaultsSettingsRecord> =
  createMasterStore<DefaultsSettingsRecord>(INITIAL_DEFAULTS_SETTINGS);
