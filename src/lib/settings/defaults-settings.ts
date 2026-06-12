/**
 * 既定値（デフォルト）設定のモジュール内シングルトン。
 *
 * - `settings/defaults` ページが書き換える
 * - 受注フォーム・商品登録フォームで getDefaultsSettings() を読み、入力初期値として利用する
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は v2 で server action + DB
 */

export interface DefaultsSettings {
  order: Record<string, string>;
  product: Record<string, string>;
  customer: Record<string, string>;
  purchase: Record<string, string>;
}

export const DEFAULT_DEFAULTS_SETTINGS: DefaultsSettings = {
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

let settings: DefaultsSettings = {
  order: { ...DEFAULT_DEFAULTS_SETTINGS.order },
  product: { ...DEFAULT_DEFAULTS_SETTINGS.product },
  customer: { ...DEFAULT_DEFAULTS_SETTINGS.customer },
  purchase: { ...DEFAULT_DEFAULTS_SETTINGS.purchase },
};

/** 現在の設定のコピーを返す */
export function getDefaultsSettings(): DefaultsSettings {
  return {
    order: { ...settings.order },
    product: { ...settings.product },
    customer: { ...settings.customer },
    purchase: { ...settings.purchase },
  };
}

/** 部分的に上書き */
export function setDefaultsSettings(patch: Partial<DefaultsSettings>): void {
  settings = {
    order: patch.order ? { ...patch.order } : { ...settings.order },
    product: patch.product ? { ...patch.product } : { ...settings.product },
    customer: patch.customer ? { ...patch.customer } : { ...settings.customer },
    purchase: patch.purchase ? { ...patch.purchase } : { ...settings.purchase },
  };
}

/** デフォルトに戻す */
export function resetDefaultsSettings(): void {
  settings = {
    order: { ...DEFAULT_DEFAULTS_SETTINGS.order },
    product: { ...DEFAULT_DEFAULTS_SETTINGS.product },
    customer: { ...DEFAULT_DEFAULTS_SETTINGS.customer },
    purchase: { ...DEFAULT_DEFAULTS_SETTINGS.purchase },
  };
}
