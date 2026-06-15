/**
 * 発送方法 共有マスタストア
 *
 * 受注発送方法区分の登録を画面横断で共有する。
 * 永続化（domain: "shipping-methods"）の正規オーナーページは
 * src/app/orders/categories/shipping/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  fee: number;
  leadDays: number;
  cod: boolean;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_SHIPPING_METHODS: ShippingMethod[] = [
  { id: "SM-1", code: "SHP01", name: "ヤマト運輸（宅急便）", fee: 800, leadDays: 1, cod: true, enabled: true },
  { id: "SM-2", code: "SHP02", name: "佐川急便", fee: 780, leadDays: 1, cod: true, enabled: true },
  { id: "SM-3", code: "SHP03", name: "日本郵便（ゆうパック）", fee: 820, leadDays: 2, cod: true, enabled: true },
  { id: "SM-4", code: "SHP04", name: "ネコポス", fee: 300, leadDays: 2, cod: false, enabled: true },
  { id: "SM-5", code: "SHP05", name: "クリックポスト", fee: 185, leadDays: 3, cod: false, enabled: true },
  { id: "SM-6", code: "SHP06", name: "西濃運輸（大型便）", fee: 2200, leadDays: 3, cod: false, enabled: false },
];

/** クライアントセッション内で共有される単一の ShippingMethodsStore インスタンス */
export const shippingMethodsStore: MasterStore<ShippingMethod> =
  createMasterStore<ShippingMethod>(INITIAL_SHIPPING_METHODS);
