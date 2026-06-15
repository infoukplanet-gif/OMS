/**
 * 納期区分 共有マスタストア
 *
 * お届け可能時期の区分定義を画面横断で共有する。
 * 複数行の add / edit / delete を持つ CRUD 型なので createMasterStore を利用。
 *
 * - クライアントセッション内で生存（リロードで初期シードに戻る）
 * - 永続化（domain: "delivery-periods"）の正規オーナーページは
 *   src/app/products/delivery-period/page.tsx
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface DeliveryPeriod {
  id: string;
  code: string;
  label: string;
  minDays: number;
  maxDays: number;
  displayTextForCustomer: string;
  badgeColor: string;
  showOnShippingFee: boolean;
  applyToOrderCutoff: string;
  productCount: number;
  active: boolean;
  [extra: string]: unknown;
}

export const INITIAL_DELIVERY_PERIODS: DeliveryPeriod[] = [
  {
    id: "dp-1",
    code: "TODAY",
    label: "即日出荷",
    minDays: 0,
    maxDays: 0,
    displayTextForCustomer: "本日出荷（15時までのご注文）",
    badgeColor: "emerald",
    showOnShippingFee: true,
    applyToOrderCutoff: "15:00",
    productCount: 842,
    active: true,
  },
  {
    id: "dp-2",
    code: "NEXT",
    label: "翌営業日",
    minDays: 1,
    maxDays: 1,
    displayTextForCustomer: "翌営業日出荷",
    badgeColor: "blue",
    showOnShippingFee: true,
    applyToOrderCutoff: "",
    productCount: 520,
    active: true,
  },
  {
    id: "dp-3",
    code: "2-3D",
    label: "2〜3営業日",
    minDays: 2,
    maxDays: 3,
    displayTextForCustomer: "2〜3営業日以内に出荷",
    badgeColor: "amber",
    showOnShippingFee: true,
    applyToOrderCutoff: "",
    productCount: 312,
    active: true,
  },
  {
    id: "dp-4",
    code: "1W",
    label: "1週間以内",
    minDays: 4,
    maxDays: 7,
    displayTextForCustomer: "ご注文から1週間以内に出荷",
    badgeColor: "orange",
    showOnShippingFee: false,
    applyToOrderCutoff: "",
    productCount: 124,
    active: true,
  },
  {
    id: "dp-5",
    code: "ORDER",
    label: "受注生産",
    minDays: 14,
    maxDays: 30,
    displayTextForCustomer: "受注生産（2〜4週間）",
    badgeColor: "red",
    showOnShippingFee: false,
    applyToOrderCutoff: "",
    productCount: 44,
    active: true,
  },
  {
    id: "dp-6",
    code: "SOLD",
    label: "販売終了",
    minDays: 0,
    maxDays: 0,
    displayTextForCustomer: "販売終了",
    badgeColor: "gray",
    showOnShippingFee: false,
    applyToOrderCutoff: "",
    productCount: 0,
    active: false,
  },
];

/** クライアントセッション内で共有される単一の DeliveryPeriodStore インスタンス */
export const deliveryPeriodStore: MasterStore<DeliveryPeriod> =
  createMasterStore<DeliveryPeriod>(INITIAL_DELIVERY_PERIODS);
